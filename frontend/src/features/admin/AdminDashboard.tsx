import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Truck, 
  Fuel, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../../services/supabase';
import { getLocalDateString, formatDisplayDate } from '../../utils/dateUtils';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, colorTheme = 'stone' }: any) => {
  const themes: any = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    stone: { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200' },
  };

  const theme = themes[colorTheme] || themes.stone;

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${theme.bg} ${theme.text} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {trendValue || '0%'}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-stone-500 font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-stone-900 tracking-tight">{value}</h3>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    cod: 0,
    petrol: 0,
    labour: 0,
    profit: 0
  });
  const [pendingSettlements, setPendingSettlements] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const today = getLocalDateString();
      
      // 1. Fetch today's COD from settlements
      const { data: settlementsToday } = await supabase
        .from('settlements')
        .select('cod_collected, petrol_expense, other_expenses, final_amount')
        .eq('date', today);

      const totalCod = settlementsToday?.reduce((sum, s) => sum + s.cod_collected, 0) || 0;
      
      // 2. Fetch today's petrol expenses
      const { data: petrolToday } = await supabase
        .from('petrol_expenses')
        .select('amount')
        .eq('date', today)
        .eq('status', 'approved');

      const totalPetrol = petrolToday?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // 3. Fetch labour costs (based on today's attendance)
      const { data: attendanceToday } = await supabase
        .from('attendance')
        .select('profile_id, status')
        .eq('date', today)
        .in('status', ['present', 'half_day']);

      const { data: labourData } = await supabase
        .from('labour')
        .select('profile_id, wage_amount, wage_type')
        .eq('status', 'active');

      let totalLabour = 0;
      if (attendanceToday && labourData) {
        attendanceToday.forEach((record: any) => {
          const labourInfo = labourData.find(l => l.profile_id === record.profile_id);
          if (labourInfo && labourInfo.wage_type === 'daily') {
            const amount = labourInfo.wage_amount || 0;
            totalLabour += record.status === 'half_day' ? amount / 2 : amount;
          }
        });
      }

      // 4. Fetch pending settlements
      const { data: pending } = await supabase
        .from('settlements')
        .select('*, profiles(full_name, id)')
        .eq('status', 'pending')
        .order('date', { ascending: false })
        .limit(5);

      setPendingSettlements(pending || []);

      // 5. Fetch last 7 days of data for the chart
      const pastDays = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        pastDays.push(d.toISOString().split('T')[0]);
      }

      const { data: historicalSettlements } = await supabase
        .from('settlements')
        .select('date, cod_collected, petrol_expense, other_expenses')
        .in('date', pastDays);

      const chartDataMap = pastDays.map(date => {
        const dayData = historicalSettlements?.filter(s => s.date === date) || [];
        const income = dayData.reduce((sum, s) => sum + s.cod_collected, 0);
        const expenses = dayData.reduce((sum, s) => sum + s.petrol_expense + s.other_expenses, 0);
        
        return {
          name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          fullDate: date,
          income,
          expenses
        };
      });

      setChartData(chartDataMap);

      setStats({
        cod: totalCod,
        petrol: totalPetrol,
        labour: totalLabour,
        profit: totalCod - totalPetrol - totalLabour
      });
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSettlementAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('settlements')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error(`Error ${status} settlement:`, error);
      alert(`Failed to ${status} settlement`);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-stone-400">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p>Loading dashboard insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Dashboard</h1>
          <p className="text-stone-500 mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex items-center space-x-3 bg-stone-50 px-4 py-2 rounded-xl border border-stone-200">
          <Calendar className="w-5 h-5 text-stone-400" />
          <span className="text-sm font-semibold text-stone-700">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Financial Overview Section */}
      <section>
        <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center">
          <Wallet className="w-5 h-5 mr-2 text-stone-400" />
          Money Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Cash Collected" 
            value={`₹${stats.cod.toLocaleString()}`} 
            icon={Wallet} 
            trend="up"
            colorTheme="emerald"
          />
          <StatCard 
            title="Fuel Costs" 
            value={`₹${stats.petrol.toLocaleString()}`} 
            icon={Fuel} 
            trend="down"
            colorTheme="rose"
          />
          <StatCard 
            title="Staff Wages" 
            value={`₹${stats.labour.toLocaleString()}`} 
            icon={Users} 
            trend="up"
            colorTheme="amber"
          />
          <StatCard 
            title="Net Income" 
            value={`₹${stats.profit.toLocaleString()}`} 
            icon={TrendingUp} 
            trend={stats.profit >= 0 ? 'up' : 'down'}
            colorTheme="blue"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Income vs Expenses Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-stone-900">Income vs Costs</h3>
              <p className="text-sm text-stone-500">Cash In vs Cash Out over the last 7 days</p>
            </div>
            <div className="flex space-x-2">
              <div className="flex items-center text-xs font-medium text-stone-500">
                <span className="w-3 h-3 rounded-full bg-emerald-500 mr-1"></span> Cash In
              </div>
              <div className="flex items-center text-xs font-medium text-stone-500">
                <span className="w-3 h-3 rounded-full bg-rose-500 mr-1"></span> Cash Out
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a8a29e', fontSize: 12, fontWeight: 500 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a8a29e', fontSize: 12, fontWeight: 500 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#fafaf9' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                    padding: '16px',
                    fontFamily: 'inherit'
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                  labelStyle={{ color: '#78716c', marginBottom: '8px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <Bar name="Cash In" dataKey="income" fill="#10b981" radius={[6, 6, 6, 6]} barSize={12} />
                <Bar name="Cash Out" dataKey="expenses" fill="#f43f5e" radius={[6, 6, 6, 6]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Settlements */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-stone-900">Payments to Approve</h3>
              <p className="text-sm text-stone-500">Payments waiting for your approval</p>
            </div>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
              {pendingSettlements.length} Waiting
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
            {pendingSettlements.length > 0 ? (
              pendingSettlements.map((settlement) => (
                <div key={settlement.id} className="group p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-stone-200 shadow-sm text-stone-600 font-bold text-sm">
                        {settlement.profiles?.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">{settlement.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-stone-500">{formatDisplayDate(settlement.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-stone-900">₹{settlement.final_amount.toLocaleString()}</p>
                      <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">Amount</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-2 pt-3 border-t border-stone-200/50">
                    <button 
                      onClick={() => handleSettlementAction(settlement.id, 'approved')}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center"
                    >
                      <CheckCircle className="w-3 h-3 mr-1.5" /> Mark Paid
                    </button>
                    <button 
                      onClick={() => handleSettlementAction(settlement.id, 'rejected')}
                      className="flex-1 py-2 bg-white text-stone-600 border border-stone-200 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center"
                    >
                      <XCircle className="w-3 h-3 mr-1.5" /> Decline
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-stone-400">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4 border border-stone-100">
                  <CheckCircle className="w-8 h-8 text-emerald-200" />
                </div>
                <p className="text-sm font-medium text-stone-500">All caught up!</p>
                <p className="text-xs text-stone-400 mt-1">No payments waiting for approval.</p>
              </div>
            )}
          </div>
          
          {pendingSettlements.length > 0 && (
            <div className="mt-4 pt-4 border-t border-stone-100 text-center">
              <button className="text-xs font-bold text-stone-500 hover:text-stone-900 uppercase tracking-wider transition-colors">
                View All History
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
