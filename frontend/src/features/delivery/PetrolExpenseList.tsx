import React, { useState, useEffect } from 'react';
import { Fuel, CheckCircle, XCircle, Search, Filter, MoreVertical, Calendar, User, MapPin, Truck } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { PetrolExpense } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';

export const PetrolExpenseList: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    fetchExpenses();
    fetchPartners();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, expenses, dateRange, statusFilter, partnerFilter]);

  const fetchPartners = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'delivery_partner')
        .order('full_name');
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    // 1. Search Term
    if (searchTerm.trim() !== '') {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.profiles?.full_name?.toLowerCase().includes(lowerTerm) ||
        expense.bunk_name?.toLowerCase().includes(lowerTerm) ||
        expense.vehicle_number?.toLowerCase().includes(lowerTerm)
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(expense => expense.status === statusFilter);
    }

    // 3. Partner Filter
    if (partnerFilter !== 'all') {
      filtered = filtered.filter(expense => expense.partner_id === partnerFilter);
    }

    // 4. Date Range Filter
    if (dateRange.start) {
      filtered = filtered.filter(expense => expense.date >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter(expense => expense.date <= dateRange.end);
    }

    setFilteredExpenses(filtered);
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('petrol_expenses')
        .select(`
          *,
          profiles:partner_id (full_name, email)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
      setFilteredExpenses(data || []);
    } catch (error) {
      console.error('Error fetching petrol expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPartnerFilter('all');
    setDateRange({ start: '', end: '' });
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('petrol_expenses')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      fetchExpenses();
    } catch (error) {
      console.error('Error approving expense:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('petrol_expenses')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      fetchExpenses();
    } catch (error) {
      console.error('Error rejecting expense:', error);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200'
    };
    
    const config = styles[status as keyof typeof styles] || styles.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${config}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Fuel Costs</h1>
          <p className="text-stone-500">Review and approve fuel costs</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Search and Filter Toggle Bar */}
        <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by partner, bunk, or vehicle..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors ${showFilters ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </button>
            {(statusFilter !== 'all' || partnerFilter !== 'all' || dateRange.start || dateRange.end) && (
              <button 
                onClick={clearFilters}
                className="text-xs font-medium text-red-600 hover:text-red-700 px-2"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="p-4 bg-stone-50 border-b border-stone-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase mb-1.5">Partner</label>
              <select
                value={partnerFilter}
                onChange={(e) => setPartnerFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Partners</option>
                {partners.map(partner => (
                  <option key={partner.id} value={partner.id}>{partner.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase mb-1.5">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase mb-1.5">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Partner</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Bill</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Bunk Name</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-stone-400">Loading expenses...</td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-stone-400">No petrol expenses found.</td>
                </tr>
              ) : (
                filteredExpenses.map((expense: any) => (
                  <tr key={expense.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center text-stone-600 text-sm font-medium">
                        <Calendar className="w-4 h-4 mr-2 text-stone-400" />
                        {formatDisplayDate(expense.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 font-bold text-xs border border-stone-200">
                          {expense.profiles?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-900">{expense.profiles?.full_name || 'Unknown'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600 font-mono bg-stone-100 px-2 py-1 rounded-md">{expense.vehicle_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      {expense.bill_image_url ? (
                        <a 
                          href={expense.bill_image_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block w-12 h-12 rounded-lg overflow-hidden border border-stone-200 hover:border-emerald-500 transition-colors"
                        >
                          <img 
                            src={expense.bill_image_url} 
                            alt="Bill" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      ) : (
                        <span className="text-xs text-stone-400 italic">No bill</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-stone-900">₹{expense.amount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600">{expense.bunk_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={expense.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {expense.status === 'pending' && (
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleApprove(expense.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors border border-transparent hover:border-emerald-100"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleReject(expense.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors border border-transparent hover:border-red-100"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {loading ? (
            <div className="p-8 text-center text-stone-400">Loading expenses...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-stone-400">No petrol expenses found.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredExpenses.map((expense: any) => (
                <div key={expense.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 font-bold text-sm border border-stone-200">
                        {expense.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">{expense.profiles?.full_name || 'Unknown'}</p>
                        <div className="flex items-center text-xs text-stone-500 mt-0.5">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDisplayDate(expense.date)}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={expense.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-stone-50 p-2 rounded-lg col-span-2">
                      <div className="flex items-center text-stone-500 text-xs mb-1">
                        <Truck className="w-3 h-3 mr-1" />
                        Vehicle
                      </div>
                      <div className="font-mono font-medium">{expense.vehicle_number}</div>
                    </div>
                    <div className="bg-stone-50 p-2 rounded-lg col-span-2">
                      <div className="flex items-center text-stone-500 text-xs mb-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        Bunk
                      </div>
                      <div className="font-medium truncate">{expense.bunk_name}</div>
                    </div>
                    {expense.bill_image_url && (
                      <div className="bg-stone-50 p-2 rounded-lg col-span-2">
                        <div className="flex items-center text-stone-500 text-xs mb-1">
                          <span className="w-3 h-3 mr-1">📄</span>
                          Bill Image
                        </div>
                        <a 
                          href={expense.bill_image_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block mt-1 rounded-lg overflow-hidden border border-stone-200 hover:border-emerald-500 transition-colors max-w-[150px]"
                        >
                          <img 
                            src={expense.bill_image_url} 
                            alt="Bill" 
                            className="w-full h-auto object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-lg font-bold text-stone-900">₹{expense.amount}</div>
                    
                    {expense.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleReject(expense.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleApprove(expense.id)}
                          className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

