import { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  Trash2, 
  Plus, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { cn } from '@/src/lib/utils';

export default function NotificationsPage() {
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const [permission, setPermission] = useState<NotificationPermission>('default');

  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    setIsIframe(window.self !== window.top);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(collection(db, 'users', user.uid, 'notifications'));
        const unsub = onSnapshot(q, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          // Sort by schedule date
          items.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
          setScheduledNotifications(items);
          setIsLoading(false);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/notifications`);
        });
        return () => unsub();
      }
    });

    return () => unsubAuth();
  }, []);

  const [isTesting, setIsTesting] = useState(false);

  const requestPermission = async () => {
    try {
      if (!('Notification' in window)) {
        setError('Global notifications are not supported in this browser.');
        return;
      }
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        setSuccess('Notification permission granted!');
        subscribeToPush();
      } else {
        setError('Notification permission denied. Note: Browser notifications are usually blocked inside an iframe. You MUST open the app in a NEW TAB to enable them.');
      }
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError('Failed to request notification permission. Try opening the app in a NEW TAB using the button in the top right.');
    }
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator)) {
      console.error('Service Workers not supported');
      return;
    }

    try {
      setSuccess(null);
      setError(null);
      const publicVapidKey = (import.meta as any).env.VITE_VAPID_PUBLIC_KEY || 'BLhgQ0rZUQrRZoCwqLWO-wcM-INHVFPbNycffMqhDY135jqjLtP3yHaDf9tgu5XHWmo_NTYD9Wmn468y5Kogc8w';
      
      // Force clean state
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }

      console.log('Registering new service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      
      // Wait for registration to be ready
      await navigator.serviceWorker.ready;
      console.log('Service Worker ready');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicVapidKey
      });

      console.log('Subscription obtained:', subscription);

      // Send to server to store
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: auth.currentUser?.uid,
          subscription: subscription.toJSON()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save subscription on server');
      }

      console.log('Push subscription successful');
      setSuccess('Browser alerts enabled successfully! You can now receive scheduled notifications.');
      setPermission('granted');
    } catch (err: any) {
      console.error('Push subscription failed:', err);
      setError('Push subscription failed: ' + err.message + '. IMPORTANT: You MUST open the app in a NEW TAB (top right button) for this to work.');
    }
  };

  const testNotification = async () => {
    if (!auth.currentUser) return;
    setIsTesting(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: auth.currentUser.uid })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Test notification sent! You should see a popup shortly.');
      } else {
        setError('Test failed: ' + (data.error || 'Unknown error. Ensure you opened the app in a NEW TAB.'));
      }
    } catch (err: any) {
      setError('Test failed: ' + err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!title || !message || !scheduledAt) {
      setError('Please fill in all fields (Title, Message, and Date/Time)');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'notifications'), {
        userId: auth.currentUser.uid,
        title,
        message,
        scheduledAt: new Date(scheduledAt).toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setSuccess('Alert scheduled for ' + new Date(scheduledAt).toLocaleString());
      setTitle('');
      setMessage('');
      setScheduledAt('');
    } catch (err: any) {
      setError(err.message || 'Failed to schedule notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">Notifications Center</h1>
          <p className="mt-2 text-sm text-slate-500 font-medium tracking-tight">Schedule and track your automated lifestyle alerts.</p>
        </div>

        {isIframe && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-[2rem] flex items-center gap-4 md:max-w-xl">
            <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-orange-600 mb-1">Attention Needed</p>
              <p className="text-[13px] font-bold text-orange-800 leading-tight">
                Browser notifications are disabled in this preview window.
                <button 
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="block mt-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-orange-700 transition-colors"
                >
                  Open in New Tab to Enable Alerts
                </button>
              </p>
            </div>
          </div>
        )}

          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-[2rem] flex items-center gap-4 md:max-w-md">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                <HelpCircle size={20} />
              </div>
              <div className="text-[11px] font-bold text-blue-800 leading-tight">
                <p className="uppercase text-[9px] tracking-widest mb-1 opacity-70">Troubleshooting</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Turn off "Do Not Disturb" on your computer.</li>
                  <li>Ensure browser allows notifications for this site.</li>
                  <li>Open in New Tab if you are in the editor preview.</li>
                </ul>
              </div>
            </div>

            <div className={cn(
              "flex items-center gap-3 p-3 rounded-2xl border text-[10px] font-bold uppercase tracking-widest",
              permission === 'granted' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-200 text-slate-400"
            )}>
              {permission === 'granted' ? (
                <>
                  <ShieldCheck size={16} />
                  <span>Push Subscription Active</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={16} />
                  <span>Push Subscription Inactive</span>
                </>
              )}
            </div>
          </div>

        <div className="flex gap-2">
          <Button 
            onClick={subscribeToPush}
            title="Refresh Push Subscription"
            className="rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 h-10 w-10 p-0 flex items-center justify-center"
          >
            <Bell size={16} />
          </Button>
          {permission === 'granted' && (
            <Button 
              onClick={testNotification}
              disabled={isTesting}
              className="rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest h-10 px-6"
            >
              <Send size={14} className="mr-2" /> {isTesting ? 'Sending...' : 'Test Notification'}
            </Button>
          )}
          {permission !== 'granted' && (
            <Button 
              onClick={requestPermission}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest h-10 px-6"
            >
              Enable Browser Alerts
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Schedule Form */}
        <div className="col-span-12 lg:col-span-5">
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Bell size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Schedule Alert</h3>
            </div>

            <form onSubmit={handleSchedule} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title</label>
                <Input 
                  placeholder="Notification Heading"
                  value={title}
                  className="h-12 text-sm"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message</label>
                <textarea 
                  placeholder="The content of your alert..."
                  value={message}
                  className="w-full h-24 rounded-xl bg-slate-50 border-none p-4 text-sm font-medium focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all focus:bg-white resize-none"
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Schedule Date & Time</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      type="datetime-local"
                      value={scheduledAt}
                      step="1"
                      className="h-12 pl-12 text-sm font-bold"
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                  </div>
                  {scheduledAt && new Date(scheduledAt) < new Date() && (
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mt-1">Warning: This time is in the past.</p>
                  )}
                  <p className="text-[10px] font-medium text-slate-400 italic">Format depends on your device locale (e.g., DD/MM/YYYY or MM/DD/YYYY).</p>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-xl bg-red-50 text-red-500 text-xs font-bold border border-red-100 flex items-center gap-3"
                >
                  <AlertCircle size={18} className="shrink-0" /> 
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 flex items-center gap-3"
                >
                  <CheckCircle2 size={18} className="shrink-0" /> 
                  <span>{success}</span>
                </motion.div>
              )}

              <Button 
                type="submit"
                className="w-full h-12 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs hover:bg-slate-800 shadow-xl shadow-slate-200"
                isLoading={isSubmitting}
              >
                <Plus size={18} className="mr-2" /> Schedule Now
              </Button>
            </form>
          </section>
        </div>

        {/* History / Queue */}
        <div className="col-span-12 lg:col-span-7">
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Clock size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Notification History</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{scheduledNotifications.length} Total</span>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-20 w-full animate-pulse bg-slate-50 rounded-2xl" />
                  ))
                ) : scheduledNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                    <MessageSquare size={48} className="text-slate-200 mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No notifications scheduled</p>
                  </div>
                ) : (
                  scheduledNotifications.map((notif) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={notif.id}
                      className="group flex items-center gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-lg transition-all"
                    >
                      <div className={cn(
                        "h-12 w-12 shrink-0 rounded-xl flex items-center justify-center shadow-sm",
                        notif.status === 'sent' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      )}>
                        {notif.status === 'sent' ? <CheckCircle2 size={24} /> : <Calendar size={24} />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-sm font-black text-slate-900 truncate">{notif.title}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shrink-0",
                            notif.status === 'sent' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                          )}>
                            {notif.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium truncate mb-2">{notif.message}</p>
                        <div className="flex items-center gap-4 py-2 border-t border-slate-100/50 mt-2">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{notif.status === 'sent' ? 'Sent' : 'Scheduled'} Date</span>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                              <Calendar size={10} className="text-orange-500" /> 
                              {new Date(notif.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex flex-col border-l border-slate-100 pl-4">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{notif.status === 'sent' ? 'Sent' : 'Scheduled'} Time</span>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                              <Clock size={10} className="text-orange-500" /> 
                              {new Date(notif.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDelete(notif.id)}
                        className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
