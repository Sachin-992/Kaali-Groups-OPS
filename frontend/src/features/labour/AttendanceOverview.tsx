import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Search, Filter, User, ChevronLeft, ChevronRight, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { getLocalDateString, formatDisplayDate, formatDisplayTime, calculateDuration } from '../../utils/dateUtils';

export const AttendanceOverview: React.FC = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    half_day: 0,
    on_leave: 0
  });

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles:profile_id (full_name, email)
        `)
        .eq('date', selectedDate);

      if (attendanceError) throw attendanceError;

      const { data: labourData, error: labourError } = await supabase
        .from('labour')
        .select('profile_id, labour_type');

      if (labourError) throw labourError;
      
      const dataList = (attendanceData || []).map((record: any) => {
        const labourInfo = labourData?.find(l => l.profile_id === record.profile_id);
        return {
          ...record,
          labour: labourInfo ? [labourInfo] : []
        };
      });

      setAttendance(dataList);

      // Calculate stats
      const newStats = {
        total: dataList.length,
        present: dataList.filter((r: any) => r.status === 'present').length,
        absent: dataList.filter((r: any) => r.status === 'absent').length,
        half_day: dataList.filter((r: any) => r.status === 'half_day').length,
        on_leave: dataList.filter((r: any) => r.status === 'on_leave').length
      };
      setStats(newStats);

    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevDate = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleExport = () => {
    if (attendance.length === 0) return;

    const headers = ['Name', 'Type', 'Date', 'Check In', 'Check Out', 'Duration', 'Status'];
    const csvContent = [
      headers.join(','),
      ...attendance.map((record: any) => {
        const duration = calculateDuration(record.check_in, record.check_out);
        return [
          record.profiles?.full_name || 'Unknown',
          record.labour?.[0]?.labour_type || '-',
          record.date,
          record.check_in || '-',
          record.check_out || '-',
          duration,
          record.status
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAttendance = attendance.filter((record: any) => {
    const matchesType = filterType === 'all' || record.labour?.[0]?.labour_type === filterType;
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center space-x-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-stone-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-stone-900">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Attendance Overview</h1>
          <p className="text-stone-500 mt-1">Monitor daily labour attendance and shifts</p>
        </div>
        <div className="flex items-center space-x-2">
           <button 
            onClick={handleExport}
            disabled={attendance.length === 0}
            className="flex items-center px-4 py-2 bg-white text-stone-600 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button 
            onClick={fetchAttendance}
            className="p-2 bg-white text-stone-600 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Staff" 
          value={stats.total} 
          icon={User} 
          color="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Present Today" 
          value={stats.present} 
          icon={CheckCircle} 
          color="bg-emerald-50 text-emerald-600" 
        />
        <StatCard 
          title="Absent" 
          value={stats.absent} 
          icon={XCircle} 
          color="bg-rose-50 text-rose-600" 
        />
        <StatCard 
          title="Half Day" 
          value={stats.half_day} 
          icon={Clock} 
          color="bg-amber-50 text-amber-600" 
        />
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-stone-100 flex flex-col lg:flex-row justify-between items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center bg-stone-50 p-1 rounded-xl border border-stone-200">
            <button onClick={handlePrevDate} className="p-2 hover:bg-white rounded-lg text-stone-500 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center px-4 space-x-2 border-x border-stone-200 mx-1">
              <Calendar className="w-4 h-4 text-stone-400" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-stone-700 w-32 cursor-pointer"
              />
            </div>
            <button onClick={handleNextDate} className="p-2 hover:bg-white rounded-lg text-stone-500 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative group">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-hover:text-emerald-500 transition-colors" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none cursor-pointer w-full sm:w-48 hover:bg-stone-100 transition-colors"
              >
                <option value="all">All Types</option>
                <option value="agrifresh">Agrifresh</option>
                <option value="import_export">Import/Export</option>
                <option value="hotel">Hotel Serving</option>
                <option value="packing">Packing Staff</option>
                <option value="loading">Loading/Unloading</option>
              </select>
            </div>
            
            <div className="relative group">
              <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-hover:text-emerald-500 transition-colors" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none cursor-pointer w-full sm:w-40 hover:bg-stone-100 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Labour Name</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400 animate-pulse">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Loading attendance data...
                    </div>
                  </td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-stone-400">
                      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4 border border-stone-100">
                        <Calendar className="w-8 h-8 text-stone-300" />
                      </div>
                      <p className="font-bold text-stone-600 text-lg">No records found</p>
                      <p className="text-sm mt-1 text-stone-400">Try selecting a different date or adjusting filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((record: any) => (
                  <tr key={record.id} className="hover:bg-stone-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-stone-100 to-stone-200 rounded-full flex items-center justify-center text-stone-600 font-bold text-sm border border-stone-200 shadow-sm">
                          {record.profiles?.full_name?.charAt(0) || <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">{record.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-stone-500">{record.profiles?.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                        {{
                          agrifresh: 'Agrifresh',
                          import_export: 'Import/Export',
                          hotel: 'Hotel Serving',
                          packing: 'Packing Staff',
                          loading: 'Loading/Unloading'
                        }[record.labour?.[0]?.labour_type as string] || record.labour?.[0]?.labour_type || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-stone-600 text-sm font-medium">
                        {record.check_in ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 text-emerald-500" />
                            {formatDisplayTime(record.check_in)}
                          </>
                        ) : (
                          <span className="text-stone-300">--:--</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-stone-600 text-sm font-medium">
                        {record.check_out ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 text-rose-500" />
                            {formatDisplayTime(record.check_out)}
                          </>
                        ) : (
                          <span className="text-stone-300">--:--</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-stone-600 font-medium">
                        {calculateDuration(record.check_in, record.check_out)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                        record.status === 'present' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                        record.status === 'absent' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 
                        record.status === 'half_day' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {record.status === 'present' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {record.status === 'absent' && <XCircle className="w-3 h-3 mr-1" />}
                        {record.status === 'half_day' && <Clock className="w-3 h-3 mr-1" />}
                        {record.status === 'on_leave' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {record.status.replace('_', ' ')}
                      </span>
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
