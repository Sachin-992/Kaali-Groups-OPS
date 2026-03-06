import React, { useState } from 'react';
import { BarChart3, Download, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const ReportsDashboard: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const downloadSettlementReport = async () => {
    setLoading('settlement');
    try {
      const { data: settlements } = await supabase
        .from('settlements')
        .select(`
          date,
          cod_collected,
          petrol_expense,
          other_expenses,
          final_amount,
          status,
          profiles:partner_id (full_name)
        `)
        .order('date', { ascending: false });

      if (!settlements) return;

      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('Daily Settlement Report', 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableData = settlements.map((s: any) => {
        const profileName = Array.isArray(s.profiles) ? s.profiles[0]?.full_name : s.profiles?.full_name;
        return [
          s.date,
          profileName || 'Unknown',
          `Rs. ${s.cod_collected}`,
          `Rs. ${s.petrol_expense}`,
          `Rs. ${s.other_expenses}`,
          `Rs. ${s.final_amount}`,
          s.status.toUpperCase()
        ];
      });

      autoTable(doc, {
        head: [['Date', 'Partner', 'COD', 'Petrol', 'Other', 'Final', 'Status']],
        body: tableData,
        startY: 40,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [16, 185, 129] } // Emerald-500
      });

      doc.save('settlement_report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(null);
    }
  };

  const downloadPetrolReport = async () => {
    setLoading('petrol');
    try {
      const { data: expenses } = await supabase
        .from('petrol_expenses')
        .select(`
          date,
          amount,
          vehicle_number,
          bunk_name,
          status,
          profiles:partner_id (full_name)
        `)
        .order('date', { ascending: false });

      if (!expenses) return;

      const csvContent = [
        ['Date', 'Partner', 'Vehicle', 'Amount', 'Bunk Name', 'Status'],
        ...expenses.map((e: any) => {
          const profileName = Array.isArray(e.profiles) ? e.profiles[0]?.full_name : e.profiles?.full_name;
          return [
            e.date,
            profileName || 'Unknown',
            e.vehicle_number,
            e.amount,
            e.bunk_name,
            e.status
          ];
        })
      ].map(e => e.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'petrol_expenses.csv';
      link.click();
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(null);
    }
  };

  const downloadAttendanceLog = async () => {
    setLoading('attendance');
    try {
      const { data: attendance } = await supabase
        .from('attendance')
        .select(`
          date,
          check_in,
          check_out,
          status,
          profiles:profile_id (full_name, role)
        `)
        .order('date', { ascending: false });

      if (!attendance) return;

      const excelData = attendance.map((a: any) => {
        const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
        return {
          Date: a.date,
          Name: profile?.full_name || 'Unknown',
          Role: profile?.role || 'Unknown',
          'Check In': a.check_in || '-',
          'Check Out': a.check_out || '-',
          Status: a.status.toUpperCase()
        };
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      XLSX.writeFile(wb, 'attendance_log.xlsx');
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Reports</h1>
          <p className="text-stone-500">Generate and download operational reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          onClick={downloadSettlementReport}
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-2">Daily Payment Report</h3>
          <p className="text-sm text-stone-500 mb-4">Detailed breakdown of daily cash collected, costs, and net payments.</p>
          <button className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700">
            {loading === 'settlement' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download PDF
          </button>
        </div>

        <div 
          onClick={downloadPetrolReport}
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-2">Fuel Cost Report</h3>
          <p className="text-sm text-stone-500 mb-4">Monthly summary of fuel usage and approved costs.</p>
          <button className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
            {loading === 'petrol' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download CSV
          </button>
        </div>

        <div 
          onClick={downloadAttendanceLog}
          className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-2">Staff Attendance Log</h3>
          <p className="text-sm text-stone-500 mb-4">Complete attendance records including check-in/out times and wages.</p>
          <button className="flex items-center text-sm font-medium text-purple-600 hover:text-purple-700">
            {loading === 'attendance' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download Excel
          </button>
        </div>
      </div>
    </div>
  );
};
