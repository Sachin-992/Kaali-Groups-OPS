import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DeliveryLayout } from './components/layout/DeliveryLayout';
import { LabourLayout } from './components/layout/LabourLayout';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { FinancialsDashboard } from './features/admin/FinancialsDashboard';
import { ReportsDashboard } from './features/admin/ReportsDashboard';
import { PartnerMonthlyReport } from './features/admin/PartnerMonthlyReport';
import { PetrolExpenseForm } from './features/delivery/PetrolExpenseForm';
import { PetrolExpenseList } from './features/delivery/PetrolExpenseList';
import { SettlementForm } from './features/delivery/SettlementForm';
import { DeliveryPartnerList } from './features/delivery/DeliveryPartnerList';
import { AttendanceSystem } from './features/labour/AttendanceSystem';
import { AttendanceOverview } from './features/labour/AttendanceOverview';
import { LabourList } from './features/labour/LabourList';
import { DeliveryDashboard } from './features/delivery/DeliveryDashboard';
import { Loader2, ArrowLeft } from 'lucide-react';

import { UserRole } from './types';

const AppContent: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [activeView, setActiveView] = useState<string>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Simple role-based routing
  const renderContent = () => {
    const effectiveRole = profile?.role;

    switch (effectiveRole) {
      case 'admin':
      case 'manager':
        return (
          <DashboardLayout 
            activeView={activeView} 
            onNavigate={setActiveView}
            onSwitchRole={() => {}} // No longer needed
          >
            {activeView === 'dashboard' && <AdminDashboard />}
            {activeView === 'delivery' && <DeliveryPartnerList />}
            {activeView === 'petrol' && <PetrolExpenseList />}
            {activeView === 'labour' && <LabourList />}
            {activeView === 'attendance' && <AttendanceOverview />}
            {activeView === 'finance' && <FinancialsDashboard />}
            {activeView === 'partner_reports' && <PartnerMonthlyReport />}
            {activeView === 'reports' && <ReportsDashboard />}
          </DashboardLayout>
        );

      case 'delivery_partner':
        return (
          <DeliveryLayout
            activeView={activeView}
            onNavigate={setActiveView}
            onSwitchRole={() => {}} // No longer needed
          >
            {activeView === 'dashboard' && <DeliveryDashboard onAction={setActiveView} />}
            {activeView === 'petrol' && <PetrolExpenseForm />}
            {activeView === 'settlement' && <SettlementForm />}
          </DeliveryLayout>
        );

      case 'labour':
      case 'import_export_labour':
        return (
          <LabourLayout
            activeView={activeView}
            onNavigate={setActiveView}
            onSwitchRole={() => {}} // No longer needed
          >
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
                  <h1 className="text-xl font-bold text-stone-900">
                    {effectiveRole === 'import_export_labour' ? 'Import / Export Portal' : 'Labour Portal'}
                  </h1>
                  <p className="text-stone-500 mt-1 text-sm">Welcome back, {profile?.full_name}.</p>
                </div>
                <AttendanceSystem />
              </div>
            )}
            {activeView === 'attendance' && <AttendanceSystem />}
            {activeView === 'history' && (
              <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
                <h2 className="text-lg font-bold text-stone-900 mb-4">Work History</h2>
                <p className="text-stone-500 text-sm">Detailed work history coming soon.</p>
              </div>
            )}
          </LabourLayout>
        );

      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
            <div className="p-8 bg-white rounded-2xl border border-stone-200 shadow-sm text-center max-w-md w-full">
              <h1 className="text-2xl font-bold text-stone-900">Access Restricted</h1>
              <p className="text-stone-500 mt-2 mb-6">Your account does not have a valid role assigned.</p>
              <button 
                onClick={signOut}
                className="px-6 py-2 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-all w-full"
              >
                Sign Out & Try Again
              </button>
            </div>
          </div>
        );
    }
  };

  return renderContent();
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
