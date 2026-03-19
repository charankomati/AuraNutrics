import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Connection failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-aura-bg flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-aura-accent/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-aura-gold/5 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md luxury-card relative z-10"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-aura-ink flex items-center justify-center text-white font-serif text-3xl shadow-2xl shadow-aura-ink/20 mb-6">
            A
          </div>
          <h1 className="text-4xl font-serif mb-2">AuraNutrics</h1>
          <p className="text-aura-muted uppercase tracking-[0.2em] text-[10px] font-bold">Predictive Health Intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-aura-muted ml-4">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-aura-muted" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-aura-bg/50 border border-aura-ink/5 focus:outline-none focus:ring-2 focus:ring-aura-accent/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-aura-muted ml-4">Access Key</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-aura-muted" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-aura-bg/50 border border-aura-ink/5 focus:outline-none focus:ring-2 focus:ring-aura-accent/20 transition-all"
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-rose-500 text-xs text-center font-medium"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-full bg-aura-ink text-white text-xs uppercase tracking-widest font-bold hover:bg-aura-accent transition-all duration-500 flex items-center justify-center space-x-2 group disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <span>Initialize Session</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-aura-ink/5 flex items-center justify-center space-x-4">
          <Shield size={16} className="text-aura-muted" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-aura-muted">AES-256 Encrypted Access</span>
        </div>
      </motion.div>
    </div>
  );
};
