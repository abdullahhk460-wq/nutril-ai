import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, User, Bot, Loader2, RefreshCw, ChefHat, Wallet, X } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { getCoachAdvice, generateMealPlan } from '@/src/services/geminiService';
import ReactMarkdown from 'react-markdown';
import { formatCurrency, cn } from '@/src/lib/utils';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your NutriLife AI Coach. How can I help you with your health or budget today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mealItems, setMealItems] = useState<any[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
      } else {
        // Profile listener
        const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        });

        // Meals listener
        const unsubMeals = onSnapshot(collection(db, `users/${user.uid}/meals`), (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMealItems(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/meals`);
        });

        return () => {
          unsubProfile();
          unsubMeals();
        };
      }
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const advice = await getCoachAdvice(userMessage, messages, userProfile, mealItems);
      setMessages(prev => [...prev, { role: 'assistant', content: advice || "I'm sorry, I couldn't process that request." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Could not connect to AI services." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewPlan = async () => {
    if (!userProfile) return;
    setIsGeneratingPlan(true);
    try {
      const plan = await generateMealPlan({
        healthGoal: userProfile.healthGoal,
        dailyBudget: userProfile.dailyBudget,
        country: userProfile.country,
        province: userProfile.province
      });
      setMealPlan(plan);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col gap-6 lg:flex-row">
      {/* Chat Section */}
      <div className="flex flex-1 flex-col rounded-[2.5rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-6 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 transition-transform hover:scale-110">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none">AI Health Coach</h3>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="h-1 w-1 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active & Ready</span>
              </div>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl border-slate-100 bg-slate-50 text-slate-400 group">
            <X size={20} className="transition-transform group-hover:rotate-90" />
          </Button>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20 scroll-smooth"
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform hover:scale-110",
                msg.role === 'user' ? 'bg-slate-900' : 'bg-white text-emerald-600 border border-slate-100'
              )}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={cn(
                "rounded-2xl px-5 py-3.5 text-[13px] font-medium shadow-sm max-w-[85%] leading-relaxed tracking-tight",
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
              )}>
                <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-strong:text-emerald-600">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-slate-100 text-emerald-600 shadow-sm">
                <Loader2 size={20} className="animate-spin" />
              </div>
              <div className="bg-white border border-slate-100 rounded-[1.5rem] rounded-tl-none px-6 py-3 text-sm text-slate-400 font-black tracking-widest uppercase italic animate-pulse shadow-sm">
                Analysing...
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
          <form className="flex gap-3" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <div className="relative flex-1 group">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about diet, gym progress, or saving money..."
                className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-5 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 focus:bg-white font-medium transition-all group-hover:border-slate-200"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest hidden sm:inline">Press Enter</span>
              </div>
            </div>
            <Button className="h-12 w-12 shrink-0 p-0 rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95" disabled={isLoading}>
              <Send size={20} />
            </Button>
          </form>
        </div>
      </div>

      {/* AI Smart Planner Section */}
      <div className="w-full lg:w-[26rem] space-y-8">
        <div className="rounded-[2.5rem] bg-emerald-900 px-8 py-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-[80px] group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/5 blur-[40px]"></div>
          
          <div className="relative z-10 text-white">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30 transition-transform group-hover:rotate-12">
              <ChefHat size={24} className="text-white" />
            </div>
            <h3 className="mb-2 text-xl font-black tracking-tight leading-none">Smart Meal Generator</h3>
            <p className="mb-8 text-xs text-emerald-100/70 font-medium leading-relaxed">
              Personalized strategy optimized for your <span className="text-emerald-400 font-bold">{formatCurrency(userProfile?.monthlyBudget || 0)}</span> budget and <span className="text-emerald-400 font-black">{userProfile?.healthGoal || 'Not set'}</span> objective.
            </p>
            <Button 
              className="w-full bg-white hover:bg-emerald-50 text-emerald-900 border-none h-12 text-sm font-black shadow-xl shadow-black/10 rounded-xl transition-all hover:scale-[1.02] active:scale-95" 
              onClick={generateNewPlan}
              isLoading={isGeneratingPlan}
            >
              <RefreshCw className={cn("mr-3", isGeneratingPlan && "animate-spin")} size={18} />
              GENERATE PLAN
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mealPlan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm space-y-8"
            >
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Suggested Logic</h4>
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                  <Wallet size={12} />
                  Budget Fit
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { time: 'Breakfast', data: mealPlan.breakfast, icon: '🥝' },
                  { time: 'Lunch', data: mealPlan.lunch, icon: '🍱' },
                  { time: 'Dinner', data: mealPlan.dinner, icon: '🥘' },
                  { time: 'Snack', data: mealPlan.snack, icon: '🥜' }
                ].filter(m => m.data).map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-2xl border border-slate-100 transition-all group-hover:scale-110 group-hover:bg-white shadow-sm">
                      {item.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="flex gap-2 items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>{item.time}</span>
                        <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                        <span className="text-emerald-500">{item.data.calories} kcal</span>
                      </div>
                      <h5 className="font-bold text-slate-900 leading-tight tracking-tight">{item.data.name}</h5>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed opacity-80">{item.data.why}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-slate-100">
                <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                   <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cost</p>
                    <p className="text-2xl font-black text-emerald-600 leading-none">{formatCurrency(mealPlan.totalCost)}</p>
                  </div>
                   <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                    <p className="text-2xl font-black text-slate-900 leading-none">94%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!mealPlan && !isGeneratingPlan && (
          <div className="rounded-[2.5rem] border-2 border-dashed border-slate-100 p-12 text-center group hover:border-emerald-200 transition-all">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-50 text-slate-300 transition-all group-hover:scale-110 group-hover:text-emerald-300">
              <Sparkles size={32} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
              Plan Logic Ready <br /> <span className="text-[10px] opacity-60">Waiting for generation</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
