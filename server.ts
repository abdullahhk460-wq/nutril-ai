import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import webpush from 'web-push';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

export default app;

async function startServer() {

  // Initialize dependencies inside startServer for better error handling
  let db: any = null;

  try {
    // Initialize Firebase Admin
    const root = process.cwd();
    const firebaseConfigPath = path.join(root, 'firebase-applet-config.json');
    
    // Log the path we're looking at for better debugging in Vercel logs
    console.log(`Checking for Firebase config at: ${firebaseConfigPath}`);
    
    if (!fs.existsSync(firebaseConfigPath)) {
      console.warn(`WARNING: Firebase config file NOT found at ${firebaseConfigPath}. Some features may break.`);
    } else {
      const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));

      if (!admin.apps.length) {
        const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccountVar && serviceAccountVar.trim() !== '') {
          try {
            const serviceAccount = JSON.parse(serviceAccountVar);
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              projectId: firebaseConfig.projectId,
            });
            console.log('Firebase Admin initialized with Service Account from env');
          } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var, falling back to default:', e);
            admin.initializeApp({
              projectId: firebaseConfig.projectId,
            });
          }
        } else {
          admin.initializeApp({
            projectId: firebaseConfig.projectId,
          });
          console.log('Firebase Admin initialized with default credentials (Project ID)');
        }
      }

      // Use modular getFirestore
      if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
        db = getFirestore(firebaseConfig.firestoreDatabaseId);
      } else {
        db = getFirestore();
      }
    }

    // VAPID keys
    const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || 'BLhgQ0rZUQrRZoCwqLWO-wcM-INHVFPbNycffMqhDY135jqjLtP3yHaDf9tgu5XHWmo_NTYD9Wmn468y5Kogc8w';
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'sr-jA_1RJWNVrXFJf8uUjMwpx-gOmxlwLEsim_upqy0';

    webpush.setVapidDetails(
      'mailto:support@nutrilife.ai',
      vapidPublicKey,
      vapidPrivateKey
    );
    console.log('VAPID details set');

  } catch (err) {
    console.error('Failed to initialize background services:', err);
  }

  async function checkAndSendNotifications() {
    if (!db) return;
    try {
      const now = new Date();
      // Query for pending notifications that are due
      // Filter by status only to avoid composite index requirements for collectionGroup
      const snapshot = await db.collectionGroup('notifications')
        .where('status', '==', 'pending')
        .get();

      if (snapshot.empty) return;

      for (const doc of snapshot.docs) {
        const notif = doc.data();
        
        // Manual time check to avoid needing a composite index
        const scheduledTime = new Date(notif.scheduledAt);
        if (scheduledTime > now) continue;

        const userId = notif.userId;

        // Find user subscription
        const subSnapshot = await db.collection('subscriptions')
          .where('userId', '==', userId)
          .get();

        if (!subSnapshot.empty) {
          const subData = subSnapshot.docs[0].data();
          try {
            const payload = JSON.stringify({
              title: notif.title,
              message: notif.message,
              url: '/dashboard/notifications'
            });
            console.log(`[Push] Attempting to send push to user ${userId}`);
            console.log(`[Push] Payload:`, payload);
            console.log(`[Push] Subscription URL:`, subData.subscription.endpoint);
            
            const pushResult = await webpush.sendNotification(
              subData.subscription,
              payload,
              { urgency: 'high' }
            );
            console.log(`[Push] Result status:`, pushResult.statusCode);
            
            // Update status to sent
            await doc.ref.update({ status: 'sent', sentAt: now.toISOString() });
            console.log(`[Push] Notification successfully delivered to push service for user ${userId}`);
          } catch (err: any) {
            console.error(`[Push] Failed to send notification to ${userId}. Full Error:`, {
              message: err.message,
              statusCode: err.statusCode,
              headers: err.headers,
              body: err.body
            });
            if (err.statusCode === 410 || err.statusCode === 404) {
              // Subscription expired or invalid - remove it
              await subSnapshot.docs[0].ref.delete();
              console.log(`Removed expired subscription for user ${userId}`);
            }
            await doc.ref.update({ status: 'failed' });
          }
        } else {
          console.log(`No subscription found for user ${userId}`);
          // If we can't send it and it's past time, maybe mark as failed or keep pending?
          // Let's mark as failed after a certain period or just leave it for when they eventually subscribe.
          // For now, let's leave it pending so it tries again when they subscribe.
        }
      }
    } catch (err) {
      console.error('Error in notification scheduler:', err);
    }
  }

  // Run scheduler every 10 seconds for faster delivery
  if (db) {
    setInterval(checkAndSendNotifications, 10 * 1000);
  }

  app.use(express.json());

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", firebase: !!db });
  });

  // Push Subscription API
  app.post("/api/notifications/subscribe", async (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not initialized' });
    const { userId, subscription } = req.body;
    if (!userId || !subscription) return res.status(400).json({ error: 'Missing data' });

    try {
      // Upsert subscription
      const snapshot = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .get();

      if (snapshot.empty) {
        await db.collection('subscriptions').add({
          userId,
          subscription,
          updatedAt: new Date().toISOString()
        });
        console.log(`New subscription created for user ${userId}`);
      } else {
        await snapshot.docs[0].ref.update({
          subscription,
          updatedAt: new Date().toISOString()
        });
        console.log(`Subscription updated for user ${userId}`);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error saving subscription:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Test Notification API
  app.post("/api/notifications/test", async (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database not initialized' });
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
      const subSnapshot = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .get();

      if (subSnapshot.empty) {
        return res.status(404).json({ error: 'No subscription found for this user' });
      }

      const subData = subSnapshot.docs[0].data();
      await webpush.sendNotification(
        subData.subscription,
        JSON.stringify({
          title: 'Test Notification',
          message: 'It works! Your browser is now receiving push notifications from NutriLife.',
          url: '/dashboard/notifications'
        })
      );

      res.json({ success: true });
    } catch (err: any) {
      console.error('Test notification failed:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only start the server if we're not on Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
} else {
  // On Vercel, we still need to initialize things but the handler is the exported app
  startServer().catch(err => {
    console.error('Failed to start server logic on Vercel:', err);
  });
}
