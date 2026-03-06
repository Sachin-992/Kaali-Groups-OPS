import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, Loader2, Play, Square } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'motion/react';
import { getLocalDateString, getLocalTimeString, formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils';

export const AttendanceSystem: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchTodayAttendance();
    fetchAttendanceHistory();
    return () => clearInterval(timer);
  }, [profile]);

  const fetchTodayAttendance = async () => {
    if (!profile) return;
    const today = getLocalDateString();
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('date', today)
      .maybeSingle();

    if (!error && data) {
      setAttendance(data);
    }
  };

  const fetchAttendanceHistory = async () => {
    if (!profile) return;
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('profile_id', profile.id)
      .order('date', { ascending: false })
      .limit(5);

    if (!error && data) {
      setHistory(data);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const today = getLocalDateString();
      const now = getLocalTimeString();

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          profile_id: profile?.id,
          date: today,
          check_in: now,
          status: 'present'
        })
        .select()
        .single();

      if (error) throw error;
      setAttendance(data);
    } catch (error: any) {
      alert(error.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const now = getLocalTimeString();

      const { data, error } = await supabase
        .from('attendance')
        .update({ check_out: now })
        .eq('id', attendance.id)
        .select()
        .single();

      if (error) throw error;
      setAttendance(data);
    } catch (error: any) {
      alert(error.message || 'Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    if (attendance?.check_in && attendance?.check_out) {
      const start = new Date(`1970-01-01T${attendance.check_in}`);
      const end = new Date(`1970-01-01T${attendance.check_out}`);
      const diff = end.getTime() - start.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    }
    return null;
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 p-8 rounded-3xl shadow-xl text-center text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        {/* Status Indicator Badge */}
        <div className="absolute top-4 right-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg border ${
            attendance?.check_in && !attendance?.check_out 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
              : attendance?.check_out 
                ? 'bg-stone-700/50 text-stone-400 border-stone-600'
                : 'bg-stone-700/50 text-stone-400 border-stone-600'
          }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${
              attendance?.check_in && !attendance?.check_out ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
            }`}></span>
            {attendance?.check_in && !attendance?.check_out ? 'On Duty' : 'Off Duty'}
          </span>
        </div>

        <div className="relative z-10 mt-4">
          <div className="mb-10">
            <h2 className="text-6xl font-black font-mono tracking-tighter text-white drop-shadow-2xl">
              {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
              <span className="text-3xl text-stone-500 ml-1 font-medium">
                {currentTime.toLocaleTimeString([], { second: '2-digit' }).split(':')[2] || '00'}
              </span>
            </h2>
            <p className="text-stone-400 mt-3 font-bold uppercase tracking-[0.2em] text-sm">
              {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[180px]">
            {!attendance?.check_in ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCheckIn}
                disabled={loading}
                className="group relative w-48 h-48 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-all shadow-[0_0_60px_rgba(16,185,129,0.4)] flex flex-col items-center justify-center border-8 border-stone-800/50"
              >
                <div className="absolute inset-0 rounded-full border-4 border-emerald-300/30 animate-pulse"></div>
                {loading ? <Loader2 className="w-12 h-12 animate-spin text-white" /> : (
                  <>
                    <Play className="w-16 h-16 mb-3 fill-current text-white ml-2" />
                    <span className="text-lg font-black tracking-widest text-white">START</span>
                    <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Shift</span>
                  </>
                )}
              </motion.button>
            ) : !attendance?.check_out ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCheckOut}
                disabled={loading}
                className="group relative w-48 h-48 rounded-full bg-rose-500 hover:bg-rose-400 transition-all shadow-[0_0_60px_rgba(244,63,94,0.4)] flex flex-col items-center justify-center border-8 border-stone-800/50"
              >
                <div className="absolute inset-0 rounded-full border-4 border-rose-300/30 animate-pulse"></div>
                {loading ? <Loader2 className="w-12 h-12 animate-spin text-white" /> : (
                  <>
                    <Square className="w-14 h-14 mb-3 fill-current text-white" />
                    <span className="text-lg font-black tracking-widest text-white">STOP</span>
                    <span className="text-xs font-bold text-rose-100 uppercase tracking-wider">Shift</span>
                  </>
                )}
              </motion.button>
            ) : (
              <div className="w-48 h-48 rounded-full bg-stone-800 border-8 border-stone-700 flex flex-col items-center justify-center text-stone-400 shadow-inner">
                <CheckCircle className="w-16 h-16 mb-3 text-emerald-500" />
                <span className="text-lg font-black tracking-widest text-emerald-500">DONE</span>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1">{calculateDuration()}</span>
              </div>
            )}
          </div>
          
          <div className="mt-8 text-sm font-medium text-stone-400">
            {!attendance?.check_in 
              ? "Ready to start your day?" 
              : !attendance?.check_out 
                ? "You are currently clocked in." 
                : "Shift completed for today."}
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-5 rounded-2xl border transition-colors ${attendance?.check_in ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-stone-100'}`}>
          <p className="text-xs text-stone-500 uppercase font-bold tracking-wider mb-1 flex items-center">
            <Clock className="w-3 h-3 mr-1" /> Check In
          </p>
          <p className={`text-xl font-bold ${attendance?.check_in ? 'text-emerald-700' : 'text-stone-300'}`}>
            {attendance?.check_in ? formatDisplayTime(attendance.check_in) : '--:--'}
          </p>
        </div>
        <div className={`p-5 rounded-2xl border transition-colors ${attendance?.check_out ? 'bg-rose-50 border-rose-100' : 'bg-white border-stone-100'}`}>
          <p className="text-xs text-stone-500 uppercase font-bold tracking-wider mb-1 flex items-center">
            <Clock className="w-3 h-3 mr-1" /> Check Out
          </p>
          <p className={`text-xl font-bold ${attendance?.check_out ? 'text-rose-700' : 'text-stone-300'}`}>
            {attendance?.check_out ? formatDisplayTime(attendance.check_out) : '--:--'}
          </p>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center uppercase tracking-wider">
          <Calendar className="w-4 h-4 mr-2 text-stone-400" /> Recent Shifts
        </h3>
        <div className="space-y-1">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-3 px-3 hover:bg-stone-50 rounded-xl transition-colors group">
                <div>
                  <p className="text-sm font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                    {formatDisplayDate(item.date)}
                  </p>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">
                    {item.check_in ? formatDisplayTime(item.check_in) : '--:--'} - {item.check_out ? formatDisplayTime(item.check_out) : 'Active'}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                  item.status === 'present' ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                }`}>
                  {item.status}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-stone-400 text-sm italic">
              No recent history found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
