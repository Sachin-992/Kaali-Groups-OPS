import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { LogIn, Phone, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const isEmail = identifier.includes('@');
      let loginCredentials: any = { password };
      
      if (isEmail) {
        loginCredentials.email = identifier.trim().toLowerCase();
      } else {
        const sanitizedPhone = identifier.replace(/\D/g, '');
        if (sanitizedPhone.length < 10) {
          throw new Error('Please enter a valid phone number or email address.');
        }
        loginCredentials.phone = sanitizedPhone;
      }

      const { error } = await supabase.auth.signInWithPassword(loginCredentials);
      if (error) throw error;
      
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-900">Kaali Groups</h1>
          <p className="text-stone-500 mt-2">Internal Operations Management</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-stone-700 mb-2">
              Phone Number or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-stone-400" />
              </div>
              <input
                id="identifier"
                type="text"
                required
                className="block w-full pl-10 pr-3 py-3 border border-stone-300 rounded-xl leading-5 bg-stone-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                placeholder="1234567890 or name@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="block w-full px-3 py-3 border border-stone-300 rounded-xl leading-5 bg-stone-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`mt-6 p-4 rounded-xl text-sm ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="mt-8 pt-6 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold">
            Internal Use Only
          </p>
        </div>
      </motion.div>
    </div>
  );
};
