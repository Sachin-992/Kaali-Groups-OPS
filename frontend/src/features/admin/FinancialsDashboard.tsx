import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Calendar, Search, Filter, Download, CheckCircle, XCircle, Clock, Info } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { formatDisplayDate } from '../../utils/dateUtils';

export const FinancialsDashboard: React.FC = () => {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalSettled: 0,
    pendingAmount: 0,
    totalExpenses: 0
  });

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      const { data, error } = await supabase
        .from('settlements')
        .select(`
          *,
          profiles:partner_id (full_name, email)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      
      const settlementData = data || [];
      setSettlements(settlementData);

      // Calculate stats
      const totalSettled = settlementData
        .filter(s => s.status === 'approved')
        .reduce((sum, s) => sum + s.final_amount, 0);

      const pendingAmount = settlementData
        .filter(s => s.status === 'pending')
        .reduce((sum, s) => sum + s.final_amount, 0);

      const totalExpenses = settlementData
        .filter(s => s.status === 'approved')
        .reduce((sum, s) => sum + s.petrol_expense + s.other_expenses, 0);

      setStats({
        totalSettled,
        pendingAmount,
        totalExpenses
      });

    } catch (error) {
      console.error('Error fetching settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSettlements = settlements.filter(settlement => {
    const matchesSearch = settlement.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || settlement.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            Waiting
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Money Tracker</h1>
          <p className="text-stone-500 mt-1">Track daily payments and expenses</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-xl font-medium hover:bg-stone-50 transition-all shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">Total Paid</span>
          </div>
          <h3 className="text-3xl font-bold text-stone-900 tracking-tight">₹{stats.totalSettled.toLocaleString()}</h3>
          <p className="text-sm text-stone-500 mt-1 flex items-center">
            <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />
            Approved payments
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">Waiting Approval</span>
          </div>
          <h3 className="text-3xl font-bold text-stone-900 tracking-tight">₹{stats.pendingAmount.toLocaleString()}</h3>
          <p className="text-sm text-stone-500 mt-1 flex items-center">
            <Info className="w-3 h-3 mr-1 text-amber-500" />
            Needs your review
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded-lg border border-red-100">Reimbursed Costs</span>
          </div>
          <h3 className="text-3xl font-bold text-stone-900 tracking-tight">₹{stats.totalExpenses.toLocaleString()}</h3>
          <p className="text-sm text-stone-500 mt-1 flex items-center">
            <Info className="w-3 h-3 mr-1 text-red-500" />
            Petrol & other costs
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by partner name..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <select
              className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm cursor-pointer hover:bg-stone-50 transition-colors"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="approved">Paid</option>
              <option value="pending">Waiting</option>
              <option value="rejected">Declined</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Partner</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right">Cash Collected</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right">Costs</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right">Net Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400 animate-pulse">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Loading payments...
                    </div>
                  </td>
                </tr>
              ) : filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-stone-400">
                      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4 border border-stone-100">
                        <Wallet className="w-8 h-8 text-stone-300" />
                      </div>
                      <p className="font-bold text-stone-600 text-lg">No payments found</p>
                      <p className="text-sm mt-1 text-stone-400">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((settlement: any) => (
                  <tr key={settlement.id} className="hover:bg-stone-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center text-stone-600 text-sm font-medium">
                        <Calendar className="w-4 h-4 mr-2 text-stone-400" />
                        {formatDisplayDate(settlement.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-stone-100 to-stone-200 rounded-full flex items-center justify-center text-stone-600 font-bold text-sm border border-stone-200 shadow-sm">
                          {settlement.profiles?.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">{settlement.profiles?.full_name}</p>
                          <p className="text-xs text-stone-400">{settlement.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-emerald-600 font-mono bg-emerald-50 px-2 py-1 rounded-md">₹{settlement.cod_collected.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-red-600 font-mono bg-red-50 px-2 py-1 rounded-md">₹{(settlement.petrol_expense + settlement.other_expenses).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-stone-900 font-mono">₹{settlement.final_amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(settlement.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
