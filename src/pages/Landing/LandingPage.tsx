import { motion } from 'motion/react';
import { 
  ChefHat, 
  Wallet, 
  Dumbbell, 
  LineChart, 
  ShieldCheck, 
  ArrowRight, 
  Menu, 
  X, 
  Sparkles, 
  Zap, 
  Check, 
  CheckCircle2, 
  Globe, 
  Users, 
  Star,
  Quote,
  Clock,
  Layout,
  Calculator,
  Lock,
  MessageSquare
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { auth } from '@/src/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/src/components/ui/Button';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      unsub();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Testimonials', href: '#testimonials' },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFD] font-sans text-slate-900 scroll-smooth">
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "bg-white/80 backdrop-blur-2xl border-b border-slate-100 py-4" : "bg-transparent py-6"
      )}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xl transition-all group-hover:bg-emerald-600 group-hover:rotate-12">
              <ChefHat size={22} />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">NutriLife AI</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((item) => (
              <a 
                key={item.name} 
                href={item.href} 
                className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-all hover:text-slate-900"
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            {isLoggedIn ? (
              <Link to="/dashboard">
                <Button className="h-12 rounded-2xl bg-slate-900 px-8 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Login</Link>
                <Link to="/register">
                  <Button className="h-12 rounded-2xl bg-emerald-600 px-8 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all active:scale-95">
                    Start Now
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 text-slate-900"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 p-8 lg:hidden shadow-2xl"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((item) => (
                <a 
                  key={item.name} 
                  href={item.href} 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-bold text-slate-900"
                >
                  {item.name}
                </a>
              ))}
              <div className="h-px bg-slate-100 my-2"></div>
              {isLoggedIn ? (
                <Link to="/dashboard" className="text-lg font-bold text-emerald-600">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="text-lg font-bold text-slate-900">Login</Link>
                  <Link to="/register" className="text-lg font-bold text-emerald-600">Register</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      <main>
        {/* Hero Section - Recipe 11 Inspiration */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-32 pb-20">
          <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-5 py-2 mb-8 border border-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">V2.4 Now Available in Pakistan</span>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tighter text-slate-900 mb-6">
                Design <br /> Your <br /> 
                <span className="text-emerald-500 italic">Evolution.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed tracking-tight mb-8 max-w-lg">
                The first lifestyle engine that synchronizes your diet, finances, and fitness into one unified AI-driven strategy.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button className="w-full h-16 rounded-2xl bg-slate-900 px-12 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-slate-400 group">
                    Begin Journey
                    <ArrowRight className="ml-3 transition-transform group-hover:translate-x-2" size={20} />
                  </Button>
                </Link>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-12 w-12 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-sm">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">4,200+ Active Users</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Across Lahore & Karachi</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative lg:block hidden"
            >
              <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
              
              <div className="relative rounded-[3.5rem] border border-slate-200 bg-white p-6 shadow-3xl overflow-hidden group">
                <div className="aspect-[4/5] rounded-[2.5rem] bg-slate-50 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-transparent"></div>
                  {/* Mock UI Elements */}
                  <div className="absolute top-8 left-8 right-8 space-y-6">
                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-sm animate-float">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daily Forecast</span>
                        <Zap size={16} className="text-emerald-500" />
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-slate-900">12%</span>
                        <span className="text-xs font-bold text-emerald-600 mb-1">↑ Savings increase</span>
                      </div>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-3xl shadow-xl translate-x-12 animate-float-delayed">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">AI Recommendation</p>
                      <p className="text-sm font-medium text-white/90 leading-relaxed italic">
                        "Your activity is high today. Swap lunch for Grilled Chicken to hit your protein target within PKR 450."
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-[-10%] left-[-10%] right-[-10%] h-[60%] bg-gradient-to-t from-[#FBFBFD] to-transparent z-10"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Dynamic Stats Rail */}
        <section className="bg-slate-900 py-16 overflow-hidden border-y border-slate-800">
           <div className="flex animate-marquee whitespace-nowrap items-center gap-20">
              {[1,2,3,4].map((_, i) => (
                <div key={i} className="flex items-center gap-20 uppercase font-black text-slate-700 tracking-[0.4em] text-sm italic">
                  <span>Precision Nutrition</span>
                  <span>/</span>
                  <span>Fiscal Management</span>
                  <span>/</span>
                  <span>Gym Optimization</span>
                  <span>/</span>
                  <span>AI Lifestyle</span>
                  <span>/</span>
                </div>
              ))}
           </div>
        </section>

        {/* Features Grid - Bento Style */}
        <section id="features" className="py-32 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 group overflow-hidden">
                <div className="h-full rounded-[2rem] bg-white border border-slate-100 p-8 shadow-sm transition-all hover:shadow-xl hover:border-emerald-100 relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/10 mb-6">
                     <ChefHat size={24} />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter text-slate-900 mb-4">Autonomous Dieting</h3>
                  <p className="text-base text-slate-500 font-medium leading-relaxed max-w-md">
                    Real-time meal planning that adjusts to your bank balance and fridge inventory. No more guesswork, just progress.
                  </p>
                  <div className="mt-12 flex flex-wrap gap-4">
                    {['Local Prices', 'Nutrient Density', 'Waste Reduction'].map(tag => (
                      <span key={tag} className="px-4 py-2 bg-slate-50 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="rounded-[2.5rem] bg-indigo-900 text-white p-10 h-full flex flex-col justify-between group">
                  <div>
                    <Wallet size={40} className="text-indigo-400 mb-8 transition-transform group-hover:scale-110" />
                    <h4 className="text-3xl font-black tracking-tighter mb-4 leading-none">Smart Budgets</h4>
                    <p className="text-indigo-200/80 font-medium leading-relaxed text-sm">
                      Automated expense tracking that alerts you before a purchase affects your weekly goals.
                    </p>
                  </div>
                  <Button variant="ghost" className="mt-8 text-indigo-400 font-black uppercase tracking-widest text-[10px] p-0 hover:bg-transparent hover:text-white">
                    Explore Finance Docs <ArrowRight size={14} className="ml-2" />
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="h-full rounded-[2.5rem] bg-white border border-slate-100 p-10 shadow-sm transition-all hover:shadow-2xl hover:border-orange-100">
                  <Dumbbell size={32} className="text-orange-500 mb-6" />
                  <h4 className="text-2xl font-black tracking-tighter text-slate-900 mb-2">Body Protocols</h4>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">
                    Gym routines that sync with your actual calorie intake. Recovery optimized by data.
                  </p>
                </div>
              </div>

               <div className="lg:col-span-8">
                <div className="h-full rounded-[2.5rem] bg-slate-950 p-12 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/4 -translate-y-1/4 bg-emerald-500/20 blur-[100px] transition-transform group-hover:scale-150 duration-1000"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-end justify-between gap-8 h-full">
                    <div className="max-w-md">
                        <Sparkles size={40} className="text-emerald-400 mb-6" />
                        <h4 className="text-4xl font-black tracking-tighter mb-4 leading-none">The Coach<br/><span className="text-emerald-400 italic">Always Active.</span></h4>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                          Your custom-trained agent lives in the dashboard, ready to answer questions about localized nutrition or financial strategy 24/7.
                        </p>
                    </div>
                    <Link to="/ai-coach">
                      <Button className="h-14 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest text-xs px-8">Chat with AI</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works - Brutalist Recipe 5 */}
        <section id="how-it-works" className="py-32 bg-slate-50 px-6">
           <div className="mx-auto max-w-7xl">
              <div className="mb-24 flex flex-col md:flex-row justify-between items-end gap-8">
                <div className="max-w-xl">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 block mb-4 italic">The Blueprint</span>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-tight">Four Steps to <br /> Perfection.</h2>
                </div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs border-l-2 border-slate-200 pl-6 hidden md:block">
                  Optimized for the <br /> modern professional
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 overflow-hidden rounded-[3rem]">
                {[
                  { step: '01', title: 'Onboard', desc: 'Sync your goals, location, and fiscal bounds in 2 minutes.', icon: Layout },
                  { step: '02', title: 'Inventory', desc: 'Add food items you typically buy and their local prices.', icon: Calculator },
                  { step: '03', title: 'Generate', desc: 'Let AI build your weekly nutrient and spending roadmap.', icon: Sparkles },
                  { step: '04', title: 'Execute', desc: 'Log actions, track savings, and evolve your lifestyle.', icon: Lock }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-12 group transition-all hover:bg-slate-900 hover:text-white">
                    <span className="block text-6xl font-black tracking-tighter text-slate-100 transition-colors group-hover:text-slate-800 mb-12">{s.step}</span>
                    <s.icon size={24} className="text-emerald-500 mb-6" />
                    <h4 className="text-2xl font-black tracking-tighter mb-4">{s.title}</h4>
                    <p className="text-slate-400 group-hover:text-slate-500 text-sm font-medium leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
           </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-6">
          <div className="mx-auto max-w-7xl text-center mb-16">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-4">Invest in Yourself.</h2>
            <p className="text-base text-slate-500 font-medium max-w-lg mx-auto">Flexible plans for every stage of your evolution.</p>
          </div>

          <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-8">
            <div className="rounded-[3rem] border border-slate-100 bg-white p-12 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Basic</span>
              </div>
              <h3 className="text-3xl font-black tracking-tighter mb-2">Free Beta</h3>
              <p className="text-slate-400 font-medium text-sm mb-8 italic">Limited time community access</p>
              <div className="text-5xl font-black tracking-tighter mb-10 text-slate-900 italic">PKR 0 <span className="text-lg text-slate-300 not-italic">/mo</span></div>
              
              <ul className="space-y-4 mb-12">
                {['Core AI Diet Engine', 'Expense Tracking', 'Basic Progress Stats', 'Community Access'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <Check size={18} className="text-emerald-500" /> {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full h-14 rounded-2xl bg-slate-50 text-slate-900 font-black uppercase tracking-widest text-xs hover:bg-slate-100">Current Plan</Button>
            </div>

            <div className="rounded-[3rem] bg-slate-900 p-12 text-white shadow-2xl shadow-emerald-500/10 relative overflow-hidden group ring-4 ring-emerald-500/30">
               <div className="absolute top-0 right-0 p-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Most Popular</span>
              </div>
              <h3 className="text-3xl font-black tracking-tighter mb-2">Pulse Pro</h3>
              <p className="text-slate-400 font-medium text-sm mb-8 italic">Full autonomous lifestyle suite</p>
              <div className="text-5xl font-black tracking-tighter mb-10 italic">PKR 1,500 <span className="text-lg text-slate-600 not-italic">/mo</span></div>
              
              <ul className="space-y-4 mb-12">
                {[
                  'Advanced AI Financial Guard', 
                  'Multi-User/Family Sync', 
                  'Priority AI Coach Access', 
                  'Custom Gym Integrations',
                  'Inventory History Data'
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-400">
                    <CheckCircle2 size={18} className="text-emerald-400" /> {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-500 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">Go Pro Now</Button>
            </div>
          </div>
        </section>

        {/* Testimonials - Editorial Style */}
        <section id="testimonials" className="py-32 bg-emerald-950 px-6 overflow-hidden">
          <div className="mx-auto max-w-7xl relative">
            <Quote size={120} className="absolute -top-20 -left-10 text-emerald-900/50 -rotate-12" />
            
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="relative z-10">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-12 italic">
                  Trusted by <br /> The <span className="text-emerald-400">Ambbitious.</span>
                </h2>
                <div className="space-y-12">
                   <div className="flex items-start gap-8 border-l-2 border-emerald-500/30 pl-8 transition-all hover:border-emerald-400 group">
                      <div>
                        <p className="text-2xl font-serif italic text-emerald-50/80 leading-relaxed group-hover:text-white transition-colors mb-6">
                          "NutriLife transformed how I view spending in Karachi. The AI diet suggestions alone saved me PKR 12k last month without compromising my gym gains."
                        </p>
                        <div>
                           <p className="text-lg font-black text-white uppercase tracking-tighter">Zaid Ahmed</p>
                           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Fintech Professional, Lahore</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  {[4, 8, 12, 16].map((img, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                      className={cn("rounded-3xl overflow-hidden shadow-2xl grayscale transition-all hover:grayscale-0", i % 2 !== 0 ? 'mt-12' : '')}
                    >
                      <img src={`https://images.unsplash.com/photo-${1500000000000 + img*100000}?auto=format&fit=crop&q=80&w=400&h=600`} alt="Testimonial User" className="w-full h-full object-cover" />
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6">
          <div className="mx-auto max-w-7xl rounded-[3rem] bg-white border border-slate-100 p-12 md:p-20 text-center shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0,rgba(16,185,129,0.05),transparent)]"></div>
             <div className="relative z-10">
               <span className="inline-block px-4 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Evolution Awaits</span>
               <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 leading-tight mb-10">Stop Managing. <br /> Start <span className="italic text-emerald-500">Living.</span></h2>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Link to="/register">
                    <Button className="h-16 px-12 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-200">Create Free Account</Button>
                  </Link>
                  <Link to="/login" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors underline decoration-2 underline-offset-8">Already a member?</Link>
               </div>
             </div>
          </div>
        </section>
      </main>

      {/* Footer - Detailed & Functional */}
      <footer className="bg-white border-t border-slate-100 pt-24 pb-12 px-6 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-20 mb-20">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <ChefHat size={22} />
                </div>
                <span className="text-xl font-black tracking-tighter text-slate-900 lowercase italic">nutrilife ai/</span>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed mb-8 max-w-sm">
                Pakistan's first unified lifestyle OS. Synchronizing your physical health and financial stability through localized AI logic.
              </p>
              <div className="flex gap-4">
                {['Twitter', 'Instagram', 'LinkedIn'].map(social => (
                  <a key={social} href="#" className="h-10 w-10 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                    <span className="sr-only">{social}</span>
                    <Globe size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-12">
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-8 italic">Navigation</h4>
                  <ul className="space-y-4">
                    <li><Link to="/" className="text-sm font-bold text-slate-900 hover:text-emerald-500">Home</Link></li>
                    <li><a href="#features" className="text-sm font-bold text-slate-900 hover:text-emerald-500">Features</a></li>
                    <li><a href="#pricing" className="text-sm font-bold text-slate-900 hover:text-emerald-500">Pricing</a></li>
                    <li><Link to="/login" className="text-sm font-bold text-slate-900 hover:text-emerald-500">Login</Link></li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-8 italic">Product</h4>
                  <ul className="space-y-4">
                    <li><Link to="/ai-coach" className="text-sm font-bold text-slate-900 hover:text-emerald-500">AI Coach</Link></li>
                    <li><Link to="/meal-planner" className="text-sm font-bold text-slate-900 hover:text-emerald-500">Inventory</Link></li>
                    <li><Link to="/budget" className="text-sm font-bold text-slate-900 hover:text-emerald-500">Fiscal Tool</Link></li>
                    <li><Link to="/onboarding" className="text-sm font-bold text-slate-900 hover:text-emerald-500">Onboarding</Link></li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-8 italic">Company</h4>
                  <ul className="space-y-4">
                    <li><span className="text-sm font-bold text-slate-900 opacity-50 cursor-not-allowed">About Us</span></li>
                    <li><span className="text-sm font-bold text-slate-900 opacity-50 cursor-not-allowed">Careers</span></li>
                    <li><span className="text-sm font-bold text-slate-900 opacity-50 cursor-not-allowed">Contact</span></li>
                    <li><span className="text-sm font-bold text-slate-900 opacity-50 cursor-not-allowed">Partner</span></li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-8 italic">Legal</h4>
                  <ul className="space-y-4">
                    <li><span className="text-sm font-bold text-slate-900 opacity-50 cursor-not-allowed">Tax Laws</span></li>
                    <li><span className="text-sm font-bold text-slate-900 opacity-50 cursor-not-allowed">Privacy</span></li>
                    <li><span className="text-sm font-bold text-slate-900 opacity-50 cursor-not-allowed">ToS</span></li>
                  </ul>
               </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">© 2024 NutriLife Technologies. Optimized for AI Studio.</p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

