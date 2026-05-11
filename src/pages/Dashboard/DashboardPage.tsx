import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ChefHat, 
  CircleAlert, 
  CheckCircle2, 
  ArrowUpRight,
  Clock,
  Sparkles,
  Loader2,
  Bell
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { formatCurrency, cn } from '@/src/lib/utils';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/src/components/ui/Button';

const chartData = [
  { name: 'Mon', spent: 1200, budget: 1500 },
  { name: 'Tue', spent: 1400, budget: 1500 },
  { name: 'Wed', spent: 1800, budget: 1500 },
  { name: 'Thu', spent: 1300, budget: 1500 },
  { name: 'Fri', spent: 2100, budget: 1500 },
  { name: 'Sat', spent: 1900, budget: 1500 },
  { name: 'Sun', spent: 1200, budget: 1500 },
];

const StatCard = ({ title, value, subValue, icon: Icon, color, trend }: any) => (
  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
    <div className="mb-4 flex items-center justify-between">
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-opacity-10", color)}>
        <Icon size={24} className={color.replace('bg-', 'text-').replace('- opacity-10', '')} />
      </div>
      {trend && (
        <span className={`text-[10px] font-black ${trend > 0 ? 'text-red-500' : 'text-emerald-500'} flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full uppercase tracking-tighter`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-xl font-black text-slate-900 mt-1 leading-none">{value}</h3>
      {subValue && <p className="mt-1 text-[9px] font-bold text-slate-400 tracking-tight">{subValue}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mealItems, setMealItems] = useState<any[]>([]);
  const [isAccepted, setIsAccepted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else {
        const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            navigate('/onboarding');
          }
          setIsLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        });

        // Fetch user's meals for the summary
        const mealsQuery = collection(db, `users/${user.uid}/meals`);
        const unsubMeals = onSnapshot(mealsQuery, (snapshot) => {
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
    return unsubAuth;
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">
            Welcome back, {userProfile?.fullName?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">
            {today} • Health Goal: <span className="text-emerald-600 font-bold">{userProfile?.healthGoal || 'Not Set'}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-600 cursor-pointer shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <Bell size={22} />
          </div>
          <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md cursor-pointer group">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.fullName || 'User')}&background=10b981&color=fff`} 
              className="h-9 w-9 rounded-xl border-2 border-white shadow-sm transition-transform group-hover:scale-105" 
              alt="Avatar"
            />
            <span className="text-sm font-black text-slate-700 tracking-tight">{userProfile?.fullName?.split(' ')[0]}</span>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Daily Budget" 
          value={formatCurrency(userProfile?.dailyBudget || 0)} 
          subValue="Available for Food" 
          trend={0}
          icon={Wallet} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Monthly Target" 
          value={formatCurrency(userProfile?.monthlyBudget || 0)} 
          subValue="Fiscal Limit"
          icon={TrendingUp} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="AI Score" 
          value="92" 
          subValue="Strategy Health" 
          trend={5}
          icon={CheckCircle2} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Active Mission" 
          value={userProfile?.healthGoal || 'Wellness'} 
          subValue="Primary focus"
          icon={TrendingDown} 
          color="bg-orange-500" 
        />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Spending & AI */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Spending Overview</h3>
              <select className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all hover:bg-slate-50 cursor-pointer uppercase tracking-widest">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
                    dy={12}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="spent" 
                    stroke="#10B981" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorSpent)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-emerald-900 rounded-[2.5rem] p-8 shadow-2xl text-white relative overflow-hidden group">
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="h-2.5 w-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_12px_#34d399]"></span>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">AI Lifestyle Recommendation</p>
              </div>
              
              {isAccepted ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight">Strategy Synchronized</h3>
                      <p className="text-sm text-emerald-200/70 font-medium">Your diet and budget parameters have been optimized for this week.</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold px-8 h-12 rounded-2xl backdrop-blur-sm transition-all"
                    onClick={() => setIsAccepted(false)}
                  >
                    Reset Optimization
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-medium leading-relaxed mb-6 font-sans">
                    "Based on your <span className="text-emerald-400 font-bold">{formatCurrency(userProfile?.monthlyBudget || 0)}</span> monthly budget, you can save 12% by bulk-buying grains today. Your <span className="text-emerald-400 font-bold">{userProfile?.healthGoal}</span> target requires optimized protein for Dinner."
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 h-12 rounded-2xl border-none shadow-lg shadow-emerald-950 transition-all hover:scale-105 active:scale-95"
                      onClick={() => setIsAccepted(true)}
                    >
                      Accept Adjustment
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold px-8 h-12 rounded-2xl backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                      onClick={() => navigate('/dashboard/ai-coach')}
                    >
                      View Weekly Logic
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div className="absolute -right-20 -bottom-20 h-96 w-96 bg-emerald-400/10 rounded-full blur-[120px] transition-transform duration-1000 group-hover:scale-110"></div>
            <div className="absolute -left-10 -top-10 h-40 w-40 bg-emerald-400/5 rounded-full blur-[60px]"></div>
          </section>
        </div>

        {/* Right Column: Meals & Progress */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          {/* Today's Meal Plan - Sleek Style */}
          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Meal Rotation</h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full uppercase tracking-widest">Clean Eating</span>
            </div>
            <div className="space-y-3 flex-1">
              {mealItems.slice(0, 3).map((m, i) => (
                <div key={i} className={cn(
                  "group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300",
                  "bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5"
                )}>
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm border border-slate-100 transition-all group-hover:rotate-6 group-hover:scale-110")}>
                    {m.category === 'breakfast' ? '🍳' : m.category === 'lunch' ? '🍱' : '🥘'}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-emerald-600 tracking-widest uppercase mb-1">{m.category}</p>
                    <h4 className="font-bold text-slate-900 tracking-tight leading-tight">{m.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Custom entry from your inventory</p>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                       <span className="text-sm font-black text-slate-900">{formatCurrency(m.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {mealItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                     No rotation items set.<br/>
                     <span className="text-[10px] opacity-60">Add some in Meal Planner</span>
                   </p>
                </div>
              )}
            </div>
            <Button variant="outline" className="mt-8 w-full border-slate-100 bg-slate-50 text-slate-900 font-black h-14 rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest text-xs">
              View Analytics
            </Button>
          </section>

          {/* Budget Pulse - Sleek Style */}
          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="mb-4 text-lg font-bold text-slate-900 tracking-tight">Budget Pulse</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Daily Cap</span>
                  <span className="text-slate-900">{formatCurrency(userProfile?.dailyBudget || 0)}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_#10b98144]" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Monthly Goal</span>
                  <span className="text-slate-900">{formatCurrency(userProfile?.monthlyBudget || 0)}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-1000 shadow-[0_0_8px_#fbbf2444]" style={{ width: '32%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between rounded-3xl bg-slate-50 p-6 border border-slate-100 shadow-inner group">
              <div>
                <p className="text-2xl font-black text-slate-900 leading-none mb-1">$46.00</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Est. Monthly Savings</p>
              </div>
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 shadow-sm transition-all group-hover:scale-110 group-hover:rotate-12">
                <TrendingUp size={24} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
