import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  Save, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { formatCurrency, cn } from '@/src/lib/utils';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function BudgetPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({
    dailyBudget: false,
    weeklyBudget: false,
    monthlyBudget: false
  });
  const [budgets, setBudgets] = useState({
    dailyBudget: '',
    weeklyBudget: '',
    monthlyBudget: ''
  });
  
  const navigate = useNavigate();

  const validate = (field: string, value: string) => {
    const num = Number(value);
    const isValid = !isNaN(num) && num > 0;
    setErrors(prev => ({ ...prev, [field]: !isValid }));
    return isValid;
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else {
        const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile(data);
            setBudgets({
              dailyBudget: data.dailyBudget.toString(),
              weeklyBudget: data.weeklyBudget.toString(),
              monthlyBudget: data.monthlyBudget.toString()
            });
          } else {
            navigate('/onboarding');
          }
          setIsLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        });
        return () => unsubProfile();
      }
    });
    return unsubAuth;
  }, [navigate]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    
    const isDailyValid = validate('dailyBudget', budgets.dailyBudget);
    const isWeeklyValid = validate('weeklyBudget', budgets.weeklyBudget);
    const isMonthlyValid = validate('monthlyBudget', budgets.monthlyBudget);

    if (!isDailyValid || !isWeeklyValid || !isMonthlyValid) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        dailyBudget: Number(budgets.dailyBudget),
        weeklyBudget: Number(budgets.weeklyBudget),
        monthlyBudget: Number(budgets.monthlyBudget),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">Fiscal Management</h1>
        <p className="mt-2 text-sm text-slate-500 font-medium tracking-tight">Fine-tune your spending bounds and AI logic.</p>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <div className="rounded-[2.5rem] bg-white p-10 shadow-sm border border-slate-100 space-y-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daily Allocation (PKR)</label>
                  {errors.dailyBudget && <span className="text-[9px] font-black uppercase text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Positive number required</span>}
                </div>
                <Input 
                  className={cn(
                    "h-12 rounded-xl bg-slate-50 border-none focus:bg-white text-lg font-black transition-all",
                    errors.dailyBudget && "ring-2 ring-red-500/20 bg-red-50/30"
                  )}
                  type="number"
                  value={budgets.dailyBudget}
                  onChange={(e) => {
                    setBudgets({...budgets, dailyBudget: e.target.value});
                    validate('dailyBudget', e.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weekly Target (PKR)</label>
                  {errors.weeklyBudget && <span className="text-[9px] font-black uppercase text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Positive number required</span>}
                </div>
                <Input 
                  className={cn(
                    "h-12 rounded-xl bg-slate-50 border-none focus:bg-white text-lg font-black transition-all",
                    errors.weeklyBudget && "ring-2 ring-red-500/20 bg-red-50/30"
                  )}
                  type="number"
                  value={budgets.weeklyBudget}
                  onChange={(e) => {
                    setBudgets({...budgets, weeklyBudget: e.target.value});
                    validate('weeklyBudget', e.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Reserve (PKR)</label>
                  {errors.monthlyBudget && <span className="text-[9px] font-black uppercase text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Positive number required</span>}
                </div>
                <Input 
                  className={cn(
                    "h-12 rounded-xl bg-slate-50 border-none focus:bg-white text-lg font-black transition-all",
                    errors.monthlyBudget && "ring-2 ring-red-500/20 bg-red-50/30"
                  )}
                  type="number"
                  value={budgets.monthlyBudget}
                  onChange={(e) => {
                    setBudgets({...budgets, monthlyBudget: e.target.value});
                    validate('monthlyBudget', e.target.value);
                  }}
                />
              </div>
            </div>

            <Button 
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-[0.2em] uppercase text-xs shadow-lg shadow-emerald-500/10 disabled:opacity-50 disabled:grayscale"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={Object.values(errors).some(err => err)}
            >
              <Save size={18} className="mr-3" /> Update Budget System
            </Button>
          </div>

          <div className="rounded-[2rem] bg-emerald-900 p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/20 blur-3xl transition-transform group-hover:scale-125"></div>
            <div className="relative z-10 flex items-start gap-6">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-widest mb-2 text-emerald-400">Optimization Guard</h4>
                <p className="text-sm text-emerald-50/80 leading-relaxed font-sans">
                  Your monthly reserve of <span className="text-white font-black underline decoration-emerald-500 decoration-2">{formatCurrency(Number(budgets.monthlyBudget))}</span> is locked.
                  AI logic will prioritize bulk buys and nutrient-dense options to maximize every PKR.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-8">
           <div className="rounded-[2.5rem] bg-indigo-900 p-8 text-white shadow-xl shadow-indigo-100 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tighter leading-none mb-2">Financial Pulse</h3>
                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-6">AI Projections</p>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between group">
                    <div>
                      <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Savings Potential</p>
                      <p className="text-2xl font-black">12.4%</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between group">
                    <div>
                      <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Efficiency Ratio</p>
                      <p className="text-2xl font-black">0.89</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                      <TrendingDown size={20} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 rounded-2xl bg-white/5 p-6 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle size={18} className="text-indigo-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Strategy Note</p>
                </div>
                <p className="text-xs text-indigo-100/70 font-medium leading-relaxed italic">
                  Increasing Daily Allocation by 50 PKR would unlock 4 more organic options in your weekly rotation.
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
