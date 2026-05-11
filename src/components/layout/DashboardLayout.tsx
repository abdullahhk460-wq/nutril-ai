import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ChefHat, 
  Wallet, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { auth } from '@/src/lib/firebase';
import { signOut } from 'firebase/auth';

interface SidebarItemProps {
  to: string;
  icon: any;
  label: string;
}

const SidebarItem = ({ to, icon: Icon, label }: SidebarItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
      isActive 
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm" 
        : "text-slate-400 hover:text-white hover:bg-white/5"
    )}
  >
    {({ isActive }) => (
      <>
        <Icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110", isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300")} />
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-col bg-slate-900 text-white lg:flex">
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <ChefHat size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">NutriLife AI</span>
        </div>

        <nav className="flex-1 space-y-1 px-4 mt-4">
          <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/notifications" icon={Bell} label="Notifications" />
          <SidebarItem to="/meal-planner" icon={ChefHat} label="Meal Planner" />
          <SidebarItem to="/budget" icon={Wallet} label="Budgeting" />
          <SidebarItem to="/ai-coach" icon={Sparkles} label="AI Life Coach" />
          <SidebarItem to="/progress" icon={TrendingUp} label="Analytics" />
          <SidebarItem to="/loans" icon={ShieldCheck} label="Future Loans" />
        </nav>

        <div className="p-6 mt-auto">
          <div className="rounded-2xl bg-slate-800 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</p>
            <p className="text-sm font-semibold">Premium Student</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
              <div className="h-full w-3/4 bg-emerald-500"></div>
            </div>
          </div>
          
          <nav className="mt-6 space-y-1">
            <SidebarItem to="/settings" icon={Settings} label="Settings" />
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={20} className="text-slate-500" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <button onClick={() => setIsSidebarOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 transition-colors">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                <ChefHat className="text-white" size={18} />
              </div>
              <span className="text-lg font-bold tracking-tight">NutriLife</span>
            </div>
            <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 transition-colors">
              <Bell size={24} />
            </button>
          </div>
        </header>

        {/* Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Panel */}
        <aside className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white p-6 transition-transform duration-300",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
           <div className="mb-10 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                <ChefHat size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">NutriLife AI</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 transition-colors">
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-1" onClick={() => setIsSidebarOpen(false)}>
            <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem to="/notifications" icon={Bell} label="Notifications" />
            <SidebarItem to="/meal-planner" icon={ChefHat} label="Meal Planner" />
            <SidebarItem to="/budget" icon={Wallet} label="Budgeting" />
            <SidebarItem to="/ai-coach" icon={Sparkles} label="AI Life Coach" />
            <SidebarItem to="/progress" icon={TrendingUp} label="Analytics" />
            <SidebarItem to="/loans" icon={ShieldCheck} label="Future Loans" />
            
            <div className="my-6 h-px bg-slate-800" />
            
            <SidebarItem to="/settings" icon={Settings} label="Settings" />
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={20} className="text-slate-500" />
              <span>Logout</span>
            </button>
          </nav>
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Common Header for Sarah-like welcome if desired, but I'll let pages handle it or add a generic one if needed */}
        <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-24 pb-12 lg:p-8 lg:pt-8 scroll-smooth">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
