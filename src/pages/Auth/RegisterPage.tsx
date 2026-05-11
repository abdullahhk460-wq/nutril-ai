import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChefHat, ArrowRight } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '@/src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user has a profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign up with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('Email/Password registration is not yet configured. Please use Google Sign Up.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-10 rounded-[2.5rem] border border-slate-50 bg-white p-10 shadow-2xl transition-all"
      >
        <div className="text-center">
          <Link to="/" className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 transition-transform hover:scale-110 active:scale-95 group">
            <ChefHat size={32} />
          </Link>
          <h2 className="mt-8 text-4xl font-black tracking-tighter text-slate-900 leading-none">Join the Evolution</h2>
          <p className="mt-3 text-sm text-slate-400 font-black uppercase tracking-widest">
            Create your account in seconds
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 p-5 text-sm font-black uppercase tracking-widest text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <Button 
            variant="outline" 
            className="w-full h-14 bg-white flex items-center justify-center gap-4 border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 font-black uppercase tracking-[0.1em] text-[10px] text-slate-600 transition-all hover:scale-[1.02] active:scale-95"
            onClick={handleGoogleSignUp}
            isLoading={isLoading}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 grayscale opacity-50 transition-all group-hover:grayscale-0 group-hover:opacity-100" />
            Sign up with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100"></span>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-slate-300">
              <span className="bg-white px-4">Or use email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <Input 
                className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium"
                label="Full Name" 
                placeholder="Ex. John Doe" 
                autoComplete="name"
              />
              <Input 
                className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium"
                label="Email Address" 
                type="email" 
                placeholder="john@example.com" 
                autoComplete="email"
              />
              <Input 
                className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium"
                label="Password" 
                type="password" 
                placeholder="••••••••" 
              />
            </div>

            <div className="pt-4">
              <Button className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-500 transition-all rounded-2xl shadow-xl shadow-emerald-500/20" type="submit">
                Register Account
                <ArrowRight className="ml-3" size={20} />
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 hover:text-emerald-500 underline underline-offset-4 decoration-2 transition-all">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
