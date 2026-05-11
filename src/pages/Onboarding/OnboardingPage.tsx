import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Wallet, Target, ArrowRight, ArrowLeft, Plus, Trash2, MapPin, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, setDoc, writeBatch, collection, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface FoodItem {
  name: string;
  price: string;
  quantity: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if profile exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          navigate('/dashboard');
        } else {
          setIsAuthReady(true);
        }
      }
      else navigate('/login');
    });
    return () => unsubscribe();
  }, [navigate]);

  // Step 1 State
  const [country, setCountry] = useState('Pakistan');
  const [province, setProvince] = useState('');
  const [breakfast, setBreakfast] = useState<FoodItem[]>([{ name: '', price: '', quantity: '' }]);
  const [lunch, setLunch] = useState<FoodItem[]>([{ name: '', price: '', quantity: '' }]);
  const [dinner, setDinner] = useState<FoodItem[]>([{ name: '', price: '', quantity: '' }]);

  // Step 2 State
  const [dailyBudget, setDailyBudget] = useState('500');
  const [weeklyBudget, setWeeklyBudget] = useState('3500');
  const [monthlyBudget, setMonthlyBudget] = useState('15000');

  // Step 3 State
  const [healthGoal, setHealthGoal] = useState('Healthy Lifestyle');

  const addItem = (setter: React.Dispatch<React.SetStateAction<FoodItem[]>>) => {
    setter(prev => [...prev, { name: '', price: '', quantity: '' }]);
  };

  const removeItem = (setter: React.Dispatch<React.SetStateAction<FoodItem[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (setter: React.Dispatch<React.SetStateAction<FoodItem[]>>, index: number, field: keyof FoodItem, value: string) => {
    setter(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleComplete = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    const userId = auth.currentUser.uid;
    
    try {
      // 1. Save User Profile
      await setDoc(doc(db, 'users', userId), {
        fullName: auth.currentUser.displayName || 'User',
        country,
        province,
        dailyBudget: Number(dailyBudget),
        weeklyBudget: Number(weeklyBudget),
        monthlyBudget: Number(monthlyBudget),
        healthGoal,
        createdAt: new Date().toISOString()
      });

      // 2. Save Meal Items in batch
      const batch = writeBatch(db);
      
      const prepareItems = (items: FoodItem[], category: string) => {
        items.forEach(item => {
          if (item.name && item.price) {
            const mealRef = doc(collection(db, `users/${userId}/meals`));
            batch.set(mealRef, {
              userId,
              name: item.name,
              price: Number(item.price),
              quantity: item.quantity,
              category
            });
          }
        });
      };

      prepareItems(breakfast, 'breakfast');
      prepareItems(lunch, 'lunch');
      prepareItems(dinner, 'dinner');

      await batch.commit();
      navigate('/dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else handleComplete();
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-16 px-6">
      <div className="mx-auto max-w-3xl">
        {/* Progress Stepper */}
        <div className="mb-16 flex justify-between relative px-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-[1.25rem] border-2 font-black transition-all text-sm shadow-sm",
                step >= s ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'border-slate-100 bg-white text-slate-300'
              )}>
                {s === 1 && <ChefHat size={24} />}
                {s === 2 && <Wallet size={24} />}
                {s === 3 && <Target size={24} />}
              </div>
              {s < 3 && (
                <div className={cn(
                  "h-1 flex-1 mx-6 rounded-full transition-all",
                  step > s ? 'bg-emerald-600' : 'bg-slate-100'
                )} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 rounded-[2.5rem] border border-slate-50 bg-white p-10 shadow-2xl shadow-black/[0.03]"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-2 block">Foundations</span>
                <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">Food Inventory</h2>
                <p className="mt-3 text-sm text-slate-500 font-medium">Calibrate the AI with your local logistics and costs.</p>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <MapPin size={12} /> Country
                  </label>
                  <select 
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="flex h-14 w-full rounded-2xl border-none bg-slate-50 px-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white transition-all"
                  >
                    <option>Pakistan</option>
                    <option>India</option>
                    <option>Bangladesh</option>
                  </select>
                </div>

                {country === 'Pakistan' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Province</label>
                    <select 
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="flex h-14 w-full rounded-2xl border-none bg-slate-50 px-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white transition-all"
                    >
                      <option value="">Select Province</option>
                      <option>Punjab</option>
                      <option>Sindh</option>
                      <option>Khyber Pakhtunkhwa</option>
                      <option>Balochistan</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-10">
                {[
                  { label: 'Breakfast Items', state: breakfast, setter: setBreakfast },
                  { label: 'Lunch Items', state: lunch, setter: setLunch },
                  { label: 'Dinner Items', state: dinner, setter: setDinner }
                ].map((section) => (
                  <div key={section.label} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{section.label}</h3>
                      <Button variant="ghost" size="sm" onClick={() => addItem(section.setter)} className="text-emerald-600 font-black tracking-widest uppercase text-[10px] hover:bg-emerald-50">
                        <Plus size={16} className="mr-1" /> Add Entry
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {section.state.map((item, index) => (
                        <div key={index} className="flex gap-4 items-center">
                          <Input 
                            className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white text-sm font-bold shadow-sm"
                            placeholder="Item name" 
                            value={item.name} 
                            onChange={(e) => updateItem(section.setter, index, 'name', e.target.value)}
                          />
                          <Input 
                            className="h-14 w-32 rounded-2xl bg-slate-50 border-none focus:bg-white text-sm font-bold shadow-sm"
                            placeholder="Price" 
                            type="number"
                            value={item.price} 
                            onChange={(e) => updateItem(section.setter, index, 'price', e.target.value)}
                          />
                          <Button variant="outline" className="h-14 w-14 shrink-0 rounded-2xl border-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all p-0" onClick={() => removeItem(section.setter, index)}>
                            <Trash2 size={20} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 rounded-[2.5rem] border border-slate-50 bg-white p-10 shadow-2xl shadow-black/[0.03]"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-2 block">Finances</span>
                <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">Fiscal Bounds</h2>
                <p className="mt-3 text-sm text-slate-500 font-medium">Define your limits. AI will maximize efficiency within this range.</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daily Velocity (PKR)</label>
                   <Input 
                    className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white text-lg font-black shadow-sm"
                    type="number" 
                    value={dailyBudget} 
                    onChange={(e) => setDailyBudget(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weekly Target (PKR)</label>
                   <Input 
                    className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white text-lg font-black shadow-sm"
                    type="number" 
                    value={weeklyBudget} 
                    onChange={(e) => setWeeklyBudget(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Reserve (PKR)</label>
                   <Input 
                    className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white text-lg font-black shadow-sm"
                    type="number" 
                    value={monthlyBudget} 
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-[2rem] bg-slate-900 p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-3xl"></div>
                <div className="relative z-10 flex items-start gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-widest mb-1 text-emerald-400">AI Logic Check</h4>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        Monthly cap enables <span className="text-emerald-400 font-black">{Math.round(parseInt(monthlyBudget) / 30)} PKR/day</span>. 
                        AI will prioritize variety and nutrient density while locking this threshold.
                        </p>
                    </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 rounded-[2.5rem] border border-slate-50 bg-white p-10 shadow-2xl shadow-black/[0.03]"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-2 block">Objective</span>
                <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">Primary Mission</h2>
                <p className="mt-3 text-sm text-slate-500 font-medium">Determine the trajectory of your health optimizations.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {[
                  'Weight Loss', 
                  'Muscle Gain', 
                  'Gym Training', 
                  'Healthy Lifestyle', 
                  'Student Budget Eating'
                ].map((goal) => (
                  <button
                    key={goal}
                    onClick={() => setHealthGoal(goal)}
                    className={cn(
                        "flex flex-col items-start rounded-[2rem] border-2 p-8 text-left transition-all relative overflow-hidden group",
                        healthGoal === goal 
                          ? 'border-emerald-600 bg-emerald-50' 
                          : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                    )}
                  >
                    {healthGoal === goal && <div className="absolute top-4 right-4 h-2 w-2 bg-emerald-600 rounded-full animate-ping"></div>}
                    <span className={cn("text-lg font-black tracking-tight", healthGoal === goal ? 'text-emerald-900' : 'text-slate-900')}>{goal}</span>
                    <p className={cn("mt-2 text-xs font-medium leading-relaxed", healthGoal === goal ? 'text-emerald-700/70' : 'text-slate-400')}>
                      AI will recalibrate all macros and logic to prioritize {goal.toLowerCase()}.
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex gap-6">
          {step > 1 && (
            <Button variant="outline" className="flex-1 h-14 rounded-2xl border-slate-100 bg-slate-50 font-black uppercase tracking-widest text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={prevStep} disabled={isLoading}>
              <ArrowLeft className="mr-2" size={18} /> Prev Step
            </Button>
          )}
          <Button className="flex-[2] h-14 text-sm font-black uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-500/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-95" onClick={nextStep} isLoading={isLoading}>
            {step === 3 ? 'Deploy Engine' : 'Continue'}
            <ArrowRight className="ml-3" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
