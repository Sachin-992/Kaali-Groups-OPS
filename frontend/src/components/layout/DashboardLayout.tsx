import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Fuel, 
  Wallet, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  User as UserIcon,
  RefreshCcw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-emerald-50 text-emerald-700 font-medium' 
        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : ''}`} />
    <span>{label}</span>
  </button>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
  onSwitchRole?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  activeView, 
  onNavigate, 
  onSwitchRole 
}) => {
  const { profile, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'delivery_partner', 'labour'] },
    { id: 'delivery', label: 'Delivery Partners', icon: Truck, roles: ['admin', 'manager'] },
    { id: 'petrol', label: 'Petrol Expenses', icon: Fuel, roles: ['admin', 'manager', 'delivery_partner'] },
    { id: 'labour', label: 'Labour Management', icon: Users, roles: ['admin', 'manager'] },
    { id: 'attendance', label: 'Attendance', icon: Calendar, roles: ['admin', 'manager', 'labour'] },
    { id: 'finance', label: 'Money Tracker', icon: Wallet, roles: ['admin', 'manager'] },
    { id: 'partner_reports', label: 'Partner Reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { id: 'reports', label: 'Downloads', icon: BarChart3, roles: ['admin', 'manager'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 p-4">
        <div className="flex items-center space-x-3 px-4 mb-8">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">K</span>
          </div>
          <span className="text-xl font-bold text-stone-900">Kaali Ops</span>
        </div>

        <nav className="flex-1 space-y-1">
          {filteredMenuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeView === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>

        <div className="pt-4 border-t border-stone-100 space-y-1">
          <div className="flex items-center space-x-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-stone-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 truncate">{profile?.full_name}</p>
              <p className="text-xs text-stone-500 capitalize">{profile?.role.replace('_', ' ')}</p>
            </div>
          </div>
          {onSwitchRole && (
            <button
              onClick={onSwitchRole}
              className="w-full flex items-center space-x-3 px-4 py-3 text-stone-500 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all"
            >
              <RefreshCcw className="w-5 h-5" />
              <span>Switch Portal</span>
            </button>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-4 py-3 text-stone-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden bg-white border-b border-stone-200 h-16 flex items-center justify-between px-4 z-20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">K</span>
            </div>
            <span className="font-bold text-stone-900">Kaali Ops</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg"
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-72 bg-white z-40 md:hidden p-4 flex flex-col shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">K</span>
                    </div>
                    <span className="text-xl font-bold text-stone-900">Kaali Ops</span>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-stone-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <nav className="flex-1 space-y-1">
                  {filteredMenuItems.map((item) => (
                    <SidebarItem
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      active={activeView === item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setIsSidebarOpen(false);
                      }}
                    />
                  ))}
                </nav>

                <div className="pt-4 border-t border-stone-100 space-y-1">
                  {onSwitchRole && (
                    <button
                      onClick={() => {
                        onSwitchRole();
                        setIsSidebarOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-stone-500 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all"
                    >
                      <RefreshCcw className="w-5 h-5" />
                      <span>Switch Portal</span>
                    </button>
                  )}
                  <button
                    onClick={signOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-stone-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
