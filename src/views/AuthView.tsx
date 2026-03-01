import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';
import { Car, Mail, Lock, User, Phone, ChevronRight, ArrowLeft, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AuthView() {
  const { login, register } = useAuth();
  const { language, country } = useTranslation();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [role, setRole] = useState<'PASSENGER' | 'DRIVER'>('PASSENGER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [driverType, setDriverType] = useState<'TAXI' | 'VTC'>('VTC');
  const [license, setLicense] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'LOGIN') {
        await login({ email, password });
      } else {
        await register({ 
          email, 
          password, 
          name, 
          phone, 
          role,
          language,
          country,
          driverType,
          taxiLicense: driverType === 'TAXI' ? license : undefined,
          vtcLicense: driverType === 'VTC' ? license : undefined
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
            <Car size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">TaxiLibre</h1>
          <p className="text-slate-500 font-medium mt-1">
            {mode === 'LOGIN' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {mode === 'REGISTER' && (
            <div className="flex p-1 bg-slate-800 rounded-xl mb-8">
              <button 
                onClick={() => setRole('PASSENGER')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'PASSENGER' ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}
              >
                Passenger
              </button>
              <button 
                onClick={() => setRole('DRIVER')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'DRIVER' ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}
              >
                Driver
              </button>
            </div>
          )}

          {mode === 'REGISTER' && role === 'DRIVER' && (
            <div className="flex p-1 bg-slate-800 rounded-xl mb-8">
              <button 
                onClick={() => setDriverType('TAXI')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${driverType === 'TAXI' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400'}`}
              >
                Taxi
              </button>
              <button 
                onClick={() => setDriverType('VTC')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${driverType === 'VTC' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400'}`}
              >
                VTC
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'REGISTER' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="+33 6 00 00 00 00"
                      required
                    />
                  </div>
                </div>
                {role === 'DRIVER' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      {driverType === 'TAXI' ? 'Taxi License Number' : 'VTC License Number'}
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        value={license}
                        onChange={(e) => setLicense(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="ABC-123-456"
                        required
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="name@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && <p className="text-rose-500 text-sm font-medium text-center">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Processing..." : (mode === 'LOGIN' ? 'Sign In' : 'Create Account')}
              <ChevronRight size={20} />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <button 
              onClick={() => setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
              className="text-slate-400 hover:text-white font-bold transition-colors"
            >
              {mode === 'LOGIN' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-slate-600 text-xs font-medium">
          By continuing, you agree to TaxiLibre's Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
