import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Loader2, Calendar, User, FileText, IndianRupee, Truck, Clock } from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils';

export const PartnerMonthlyReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfileId && selectedMonth) {
      fetchReportData();
    } else {
      setReportData(null);
    }
  }, [selectedProfileId, selectedMonth]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone_number')
        .in('role', ['delivery_partner', 'labour', 'import_export_labour'])
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

      const profile = profiles.find(p => p.id === selectedProfileId);
      if (!profile) return;

      let data: any = {
        profile,
        summary: {}
      };

      if (profile.role === 'delivery_partner') {
        // Fetch Settlements
        const { data: settlements } = await supabase
          .from('settlements')
          .select('*')
          .eq('partner_id', selectedProfileId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true });

        // Fetch Petrol Expenses
        const { data: petrol } = await supabase
          .from('petrol_expenses')
          .select('*')
          .eq('partner_id', selectedProfileId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true });

        const totalCod = settlements?.reduce((sum, s) => sum + s.cod_collected, 0) || 0;
        const totalPetrol = petrol?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const totalOther = settlements?.reduce((sum, s) => sum + s.other_expenses, 0) || 0;
        const totalFinal = settlements?.reduce((sum, s) => sum + s.final_amount, 0) || 0;

        data.type = 'delivery';
        data.settlements = settlements || [];
        data.petrol = petrol || [];
        data.summary = {
          totalDaysWorked: settlements?.length || 0,
          totalCod,
          totalPetrol,
          totalOther,
          totalFinal
        };

      } else {
        // Labour
        const { data: attendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('profile_id', selectedProfileId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true });

        const { data: labourInfo } = await supabase
          .from('labour')
          .select('wage_amount, wage_type, labour_type')
          .eq('profile_id', selectedProfileId)
          .single();

        let totalWages = 0;
        let presentDays = 0;
        let halfDays = 0;

        if (attendance && labourInfo) {
          attendance.forEach(record => {
            if (record.status === 'present') {
              presentDays++;
              if (labourInfo.wage_type === 'daily') totalWages += labourInfo.wage_amount;
            } else if (record.status === 'half_day') {
              halfDays++;
              if (labourInfo.wage_type === 'daily') totalWages += (labourInfo.wage_amount / 2);
            }
          });
        }

        data.type = 'labour';
        data.attendance = attendance || [];
        data.labourInfo = labourInfo;
        data.summary = {
          presentDays,
          halfDays,
          absentDays: attendance?.filter(a => a.status === 'absent').length || 0,
          totalWages
        };
      }

      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Monthly Partner Data</h1>
        <p className="text-stone-500">View detailed monthly reports for individual partners and labour.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Select Month</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-stone-400" />
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Select Partner / Labour</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-stone-400" />
              </div>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
              >
                <option value="">-- Select a person --</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.role.replace(/_/g, ' ')}) - {p.phone_number}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading && selectedProfileId && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      )}

      {!loading && reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reportData.type === 'delivery' ? (
              <>
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                  <p className="text-sm text-stone-500 font-medium mb-1">Days Worked</p>
                  <p className="text-2xl font-bold text-stone-900">{reportData.summary.totalDaysWorked}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                  <p className="text-sm text-stone-500 font-medium mb-1">Total COD</p>
                  <p className="text-2xl font-bold text-emerald-600">₹{reportData.summary.totalCod.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                  <p className="text-sm text-stone-500 font-medium mb-1">Total Petrol</p>
                  <p className="text-2xl font-bold text-rose-600">₹{reportData.summary.totalPetrol.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                  <p className="text-sm text-stone-500 font-medium mb-1">Net Settled</p>
                  <p className="text-2xl font-bold text-blue-600">₹{reportData.summary.totalFinal.toLocaleString()}</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                  <p className="text-sm text-stone-500 font-medium mb-1">Present Days</p>
                  <p className="text-2xl font-bold text-emerald-600">{reportData.summary.presentDays}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                  <p className="text-sm text-stone-500 font-medium mb-1">Half Days</p>
                  <p className="text-2xl font-bold text-amber-600">{reportData.summary.halfDays}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                  <p className="text-sm text-stone-500 font-medium mb-1">Absent Days</p>
                  <p className="text-2xl font-bold text-rose-600">{reportData.summary.absentDays}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                  <p className="text-sm text-stone-500 font-medium mb-1">Est. Wages</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {reportData.labourInfo?.wage_type === 'monthly' ? 'Monthly Salary' : `₹${reportData.summary.totalWages.toLocaleString()}`}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Detailed Lists */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200 bg-stone-50">
              <h3 className="font-bold text-stone-900">Daily Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              {reportData.type === 'delivery' ? (
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-stone-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">COD Collected</th>
                      <th className="px-4 py-3 font-medium">Petrol</th>
                      <th className="px-4 py-3 font-medium">Other Exp.</th>
                      <th className="px-4 py-3 font-medium">Final Settled</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {reportData.settlements.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-stone-500">No data for this month.</td></tr>
                    ) : (
                      reportData.settlements.map((s: any) => (
                        <tr key={s.id} className="hover:bg-stone-50">
                          <td className="px-4 py-3 font-medium">{s.date}</td>
                          <td className="px-4 py-3 text-emerald-600">₹{s.cod_collected}</td>
                          <td className="px-4 py-3 text-rose-600">₹{s.petrol_expense}</td>
                          <td className="px-4 py-3 text-rose-600">₹{s.other_expenses}</td>
                          <td className="px-4 py-3 font-bold text-blue-600">₹{s.final_amount}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              s.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-stone-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Check In</th>
                      <th className="px-4 py-3 font-medium">Check Out</th>
                      <th className="px-4 py-3 font-medium">Calculated Wage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {reportData.attendance.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-500">No attendance records for this month.</td></tr>
                    ) : (
                      reportData.attendance.map((a: any) => {
                        let wage = 0;
                        if (reportData.labourInfo?.wage_type === 'daily') {
                          if (a.status === 'present') wage = reportData.labourInfo.wage_amount;
                          if (a.status === 'half_day') wage = reportData.labourInfo.wage_amount / 2;
                        }
                        return (
                          <tr key={a.id} className="hover:bg-stone-50">
                            <td className="px-4 py-3 font-medium">{a.date}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                a.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                a.status === 'half_day' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {a.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-stone-600">{a.check_in ? new Date(`2000-01-01T${a.check_in}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                            <td className="px-4 py-3 text-stone-600">{a.check_out ? new Date(`2000-01-01T${a.check_out}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                            <td className="px-4 py-3 font-medium text-emerald-600">
                              {reportData.labourInfo?.wage_type === 'monthly' ? '-' : `₹${wage}`}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
