import React from 'react';
import { 
  Shield, 
  Truck, 
  Users, 
  Package, 
  ArrowRight,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface RoleSelectionPageProps {
  onSelect: (role: UserRole | 'import_export_labour') => void;
}

export const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({ onSelect }) => {
  const { profile, signOut } = useAuth();

  const roles = [
    {
      id: 'admin',
      title: 'Admin / Manager',
      description: 'Full operations control, financial reports, and management.',
      icon: Shield,
      color: 'bg-emerald-50 text-emerald-600',
      hover: 'hover:border-emerald-200 hover:bg-emerald-50/50',
      role: 'admin'
    },
    {
      id: 'delivery_partner',
      title: 'Delivery Partner',
      description: 'Log petrol expenses, submit daily settlements, and track earnings.',
      icon: Truck,
      color: 'bg-blue-50 text-blue-600',
      hover: 'hover:border-blue-200 hover:bg-blue-50/50',
      role: 'delivery_partner'
    },
    {
      id: 'labour',
      title: 'General Labour',
      description: 'Mark attendance, view work schedule, and wage history.',
      icon: Users,
      color: 'bg-stone-50 text-stone-600',
      hover: 'hover:border-stone-200 hover:bg-stone-50/50',
      role: 'labour'
    },
    {
      id: 'import_export_labour',
      title: 'Import / Export Labour',
      description: 'Specialized portal for import/export operations and tracking.',
      icon: Package,
      color: 'bg-amber-50 text-amber-600',
      hover: 'hover:border-amber-200 hover:bg-amber-50/50',
      role: 'import_export_labour'
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-stone-900">Welcome, {profile?.full_name}</h1>
          <p className="text-stone-500 mt-2 text-lg">Select a portal to continue your work</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(role.role as any)}
              className={`group p-6 bg-white border border-stone-200 rounded-2xl text-left transition-all shadow-sm ${role.hover}`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${role.color} mb-4`}>
                  <role.icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-stone-900 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">{role.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                {role.description}
              </p>
            </motion.button>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <button 
            onClick={signOut}
            className="flex items-center space-x-2 text-stone-500 hover:text-red-600 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
