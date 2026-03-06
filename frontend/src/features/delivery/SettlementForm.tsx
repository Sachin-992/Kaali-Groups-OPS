import React, { useState, useEffect } from 'react';
import { Wallet, Calculator, Loader2, CheckCircle, AlertCircle, ArrowLeft, Fuel } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'motion/react';
import { getLocalDateString } from '../../utils/dateUtils';

export const SettlementForm: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    cod_collected: '',
    other_expenses: '',
    notes: '',
  });
  const [summary, setSummary] = useState({
    opening_balance: 0,
    petrol_expenses: 0,
    petrol_bills_count: 0,
    total_deductions: 0,
    final_settlement: 0
  });

  // Fetch today's petrol expenses and opening balance
  useEffect(() => {
    const fetchDailyData = async () => {
      if (!profile) return;

      const today = getLocalDateString();
      
      // Fetch petrol expenses for today
      const { data: petrolData } = await supabase
        .from('petrol_expenses')
        .select('amount')
        .eq('partner_id', profile.id)
        .eq('date', today)
        .eq('status', 'approved');

      const totalPetrol = petrolData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const petrolCount = petrolData?.length || 0;

      // Fetch partner opening balance
      const { data: partnerData } = await supabase
        .from('delivery_partners')
        .select('opening_balance')
        .eq('profile_id', profile.id)
        .single();

      const openingBal = partnerData?.opening_balance || 0;

      const cod = parseFloat(formData.cod_collected) || 0;
      const other = parseFloat(formData.other_expenses) || 0;
      
      const deductions = totalPetrol + other;
      // Note: The database calculates final_amount automatically, but we calculate it here for display
      const final = openingBal + cod - deductions;

      setSummary({
        opening_balance: openingBal,
        petrol_expenses: totalPetrol,
        petrol_bills_count: petrolCount,
        total_deductions: deductions,
        final_settlement: final
      });
    };

    fetchDailyData();
  }, [profile, formData.cod_collected, formData.other_expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Note: final_amount is a generated column in the database, so we don't insert it
      const { error } = await supabase
        .from('settlements')
        .insert({
          partner_id: profile?.id,
          date: getLocalDateString(),
          cod_collected: parseFloat(formData.cod_collected),
          petrol_expense: summary.petrol_expenses,
          other_expenses: parseFloat(formData.other_expenses) || 0,
          status: 'pending',
          notes: formData.notes
        });

      if (error) throw error;

      setSuccess(true);
    } catch (error: any) {
      console.error('Error submitting settlement:', error);
      alert(error.message || 'Failed to submit settlement');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm text-center max-w-md mx-auto mt-10"
      >
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Payment Submitted!</h2>
        <p className="text-stone-500 mb-8">Your daily payment has been submitted and is waiting for approval.</p>
        
        <div className="flex flex-col gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors"
            >
              Back to Dashboard
            </button>
          )}
          <button 
            onClick={() => setSuccess(false)}
            className="w-full py-3 bg-white text-stone-600 border border-stone-200 rounded-xl font-bold hover:bg-stone-50 transition-colors"
          >
            Submit Another
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-stone-100 rounded-full text-stone-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Calculator className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">Daily Payment</h2>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Cash Collected (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xl font-bold transition-all"
                    value={formData.cod_collected}
                    onChange={(e) => setFormData({ ...formData, cod_collected: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Other Costs (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    value={formData.other_expenses}
                    onChange={(e) => setFormData({ ...formData, other_expenses: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Notes / Reason</label>
                <textarea
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  rows={3}
                  placeholder="Any additional details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 h-fit">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-6">Payment Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-stone-600 text-sm">
                  <span>Opening Balance</span>
                  <span className="font-mono font-medium">₹{summary.opening_balance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600 text-sm">
                  <span>Cash Collected</span>
                  <span className="font-mono font-medium text-emerald-600">+ ₹{formData.cod_collected || '0.00'}</span>
                </div>
                <div className="flex justify-between text-stone-600 text-sm">
                  <div className="flex items-center">
                    <span>Fuel Costs</span>
                    {summary.petrol_bills_count > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full flex items-center">
                        <Fuel className="w-3 h-3 mr-1" />
                        {summary.petrol_bills_count} bills
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-medium text-red-600">- ₹{summary.petrol_expenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600 text-sm">
                  <span>Other Costs</span>
                  <span className="font-mono font-medium text-red-600">- ₹{formData.other_expenses || '0.00'}</span>
                </div>
                <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
                  <span className="text-stone-900 font-bold">Net Payment</span>
                  <span className={`text-2xl font-bold font-mono ${summary.final_settlement >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ₹{summary.final_settlement.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Please ensure all fuel bills are uploaded and <strong>approved</strong> before submitting payment. Pending bills are not deducted.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold shadow-xl hover:bg-stone-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg mt-4"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm & Submit Payment'}
          </button>
        </form>
      </div>
    </div>
  );
};
