import React, { useState } from 'react';
import { 
  Home, 
  Fuel, 
  Wallet, 
  LogOut, 
  RefreshCcw,
  User,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface DeliveryLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: any) => void;
  onSwitchRole?: () => void;
}

export const DeliveryLayout: React.FC<DeliveryLayoutProps> = ({ 
  children, 
  activeView, 
  onNavigate,
  onSwitchRole 
}) => {
  const { profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'petrol', label: 'Fuel', icon: Fuel },
    { id: 'settlement', label: 'Payment', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">K</span>
          </div>
          <div>
            <h1 className="font-bold text-stone-900 leading-tight">Kaali Ops</h1>
            <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">Delivery</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-stone-500 hover:bg-stone-50 rounded-full"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 bg-white border-b border-stone-200 shadow-xl z-10 p-4"
          >
            <div className="flex items-center space-x-3 mb-6 p-2 bg-stone-50 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-stone-600" />
              </div>
              <div>
                <p className="font-bold text-stone-900">{profile?.full_name}</p>
                <p className="text-xs text-stone-500">{profile?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              {onSwitchRole && (
                <button 
                  onClick={() => {
                    onSwitchRole();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-3 text-stone-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors"
                >
                  <RefreshCcw className="w-5 h-5" />
                  <span className="font-medium">Switch Portal</span>
                </button>
              )}
              <button 
                onClick={() => signOut()}
                className="w-full flex items-center space-x-3 p-3 text-stone-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-lg mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-stone-200 fixed bottom-0 left-0 right-0 z-20 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-emerald-600' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`p-1.5 rounded-xl ${isActive ? 'bg-emerald-50' : 'bg-transparent'}`}
                >
                  <item.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                </motion.div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
