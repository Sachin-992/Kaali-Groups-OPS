import React, { useEffect, useState } from 'react';
import { Fuel, Wallet, ArrowRight, Truck, Info, Loader2, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { getLocalDateString } from '../../utils/dateUtils';

interface DeliveryDashboardProps {
  onAction: (view: 'petrol' | 'settlement') => void;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ onAction }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Today\'s Deliveries', value: '0', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Settlements', value: '₹0', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;

      try {
        const today = getLocalDateString();
        
        // Fetch pending settlements amount
        const { data: settlements } = await supabase
          .from('settlements')
          .select('final_amount')
          .eq('partner_id', profile.id)
          .eq('status', 'pending');

        const pendingAmount = settlements?.reduce((sum, s) => sum + s.final_amount, 0) || 0;

        // Fetch today's activity (using petrol expenses as a proxy for activity if no delivery table exists)
        const { count: petrolCount } = await supabase
          .from('petrol_expenses')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', profile.id)
          .eq('date', today);

        setStats([
          { label: 'Today\'s Activity', value: (petrolCount || 0).toString(), icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Payments', value: `₹${pendingAmount.toLocaleString()}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ]);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Delivery Partner Portal</h1>
          <p className="text-stone-500 mt-1">Welcome back, <span className="text-stone-900 font-semibold">{profile?.full_name}</span></p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-4 py-2 bg-stone-100 text-stone-600 rounded-xl text-sm font-medium border border-stone-200">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100">
            <Info className="w-4 h-4" />
            <span>Partner</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-colors"
          >
            <div>
              <p className="text-sm text-stone-500 font-medium uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-bold text-stone-900 mt-2 group-hover:text-emerald-700 transition-colors">{stat.value}</p>
            </div>
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-8 h-8" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAction('petrol')}
          className="group relative p-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-[2rem] text-left overflow-hidden shadow-xl shadow-emerald-200 transition-all"
        >
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
              <Fuel className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Log Fuel Cost</h3>
            <p className="text-emerald-50 text-sm leading-relaxed max-w-[240px] opacity-90">
              Upload your fuel bills and track your daily vehicle costs easily.
            </p>
            <div className="mt-8 flex items-center text-white font-bold text-sm group-hover:translate-x-2 transition-transform bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm">
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>
          {/* Decorative background element */}
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Fuel className="w-32 h-32 text-white transform rotate-12" />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAction('settlement')}
          className="group relative p-8 bg-gradient-to-br from-stone-900 to-stone-800 rounded-[2rem] text-left overflow-hidden shadow-xl shadow-stone-300 transition-all"
        >
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/5">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Submit Daily Payment</h3>
            <p className="text-stone-400 text-sm leading-relaxed max-w-[240px]">
              Enter your daily cash collections and other costs.
            </p>
            <div className="mt-8 flex items-center text-white font-bold text-sm group-hover:translate-x-2 transition-transform bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm">
              Complete Payment <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>
          {/* Decorative background element */}
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Wallet className="w-32 h-32 text-white transform -rotate-12" />
          </div>
        </motion.button>
      </div>

      {/* Role Summary Card */}
      <div className="p-6 bg-stone-50 rounded-3xl border border-stone-200">
        <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center mb-3">
          <Info className="w-4 h-4 mr-2 text-stone-500" />
          Role Summary
        </h4>
        <p className="text-stone-600 text-sm leading-relaxed">
          As a Delivery Partner, you are responsible for the safe delivery of goods and accurate financial reporting. 
          Your primary tasks include maintaining vehicle logs, managing cash-on-delivery (COD) collections, 
          and ensuring all expenses are documented through the daily payment process.
        </p>
      </div>
    </div>
  );
};
