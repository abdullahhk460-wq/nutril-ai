import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import webpush from 'web-push';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize Firebase Admin synchronously if possible, or via a helper
const root = process.cwd();
const firebaseConfigPath = path.join(root, 'firebase-applet-config.json');
let db: any = null;

if (fs.existsSync(firebaseConfigPath)) {
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
      } catch (e) {
        admin.initializeApp({ projectId: firebaseConfig.projectId });
      }
    } else {
      admin.initializeApp({ projectId: firebaseConfig.projectId });
    }
  }
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
    const snapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .get();

    if (snapshot.empty) {
      await db.collection('subscriptions').add({
        userId,
        subscription,
        updatedAt: new Date().toISOString()
      });
    } else {
      await snapshot.docs[0].ref.update({
        subscription,
        updatedAt: new Date().toISOString()
      });
    }
    res.json({ success: true });
  } catch (err: any) {
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
    res.status(500).json({ error: err.message });
  }
});

// For Vercel, we need to handle static files differently or ensure the route is right
if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  // Important: This catch-all must be the LAST route
  app.get("*", (req, res, next) => {
    // If it's an API route or static file that wasn't found, don't serve index.html
    if (req.path.startsWith('/api/')) return next();
    
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Not Found');
    }
  });
} else {
  // Development mode with Vite
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

const PORT = Number(process.env.PORT) || 3000;

// Export the app for Vercel
// Only call listen if we are NOT on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  
  // Only run scheduler if NOT on Vercel
  if (db) {
    setInterval(async () => {
      // (The notification logic would go here, omitting for brevity in this block but making sure it exists)
      try {
        const now = new Date();
        const snapshot = await db.collectionGroup('notifications')
          .where('status', '==', 'pending')
          .get();

        if (snapshot.empty) return;

        for (const doc of snapshot.docs) {
          const notif = doc.data();
          const scheduledTime = new Date(notif.scheduledAt);
          if (scheduledTime > now) continue;

          const userId = notif.userId;
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
              await webpush.sendNotification(
                subData.subscription,
                payload,
                { urgency: 'high' }
              );
              await doc.ref.update({ status: 'sent', sentAt: now.toISOString() });
            } catch (err: any) {
              if (err.statusCode === 410 || err.statusCode === 404) {
                await subSnapshot.docs[0].ref.delete();
              }
              await doc.ref.update({ status: 'failed' });
            }
          }
        }
      } catch (err) {
        console.error('Error in notification scheduler:', err);
      }
    }, 10 * 1000);
  }
}

export default app;

