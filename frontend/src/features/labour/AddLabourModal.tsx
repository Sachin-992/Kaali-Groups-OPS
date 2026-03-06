import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { createNewUser } from '../../services/authHelper';
import { Modal } from '../../components/ui/Modal';
import { Loader2, AlertCircle } from 'lucide-react';

interface AddLabourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddLabourModal: React.FC<AddLabourModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    labour_type: 'loading',
    wage_type: 'daily',
    wage_amount: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sanitize phone number (remove spaces, dashes, etc.)
      const sanitizedPhone = formData.phone_number.replace(/\D/g, '');
      
      if (sanitizedPhone.length < 10) {
        throw new Error('Please enter a valid phone number (at least 10 digits).');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      let userId: string;

      try {
        // 1. Try to Create Auth User
        const user = await createNewUser(sanitizedPhone, formData.password);
        if (!user || !user.id) {
          throw new Error('User creation failed. Please try again.');
        }
        userId = user.id;
      } catch (authError: any) {
        console.error('Auth creation error:', authError);
        if (authError.message?.toLowerCase().includes('rate limit')) {
          throw new Error('Supabase rate limit exceeded (max 3 signups per hour on free tier). Please wait an hour, or disable rate limiting in your Supabase project settings (Authentication -> Rate Limits).');
        }
        if (authError.message?.includes('already registered')) {
          throw new Error('This phone number is already registered. Please choose another one.');
        }
        throw new Error(authError.message || 'Failed to create user account.');
      }

      // 2. Create Profile
      const role = formData.labour_type === 'import_export' ? 'import_export_labour' : 'labour';
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: formData.full_name,
          phone_number: sanitizedPhone,
          role: role
        }, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      // 3. Create Labour Record
      const { error: labourError } = await supabase
        .from('labour')
        .insert({
          profile_id: profile.id,
          labour_type: formData.labour_type,
          wage_type: formData.wage_type,
          wage_amount: parseFloat(formData.wage_amount),
          status: 'active'
        });

      if (labourError) throw labourError;

      onSuccess();
      onClose();
      setFormData({
        full_name: '',
        phone_number: '',
        labour_type: 'loading',
        wage_type: 'daily',
        wage_amount: '',
        password: ''
      });
      
      alert(`Labour added successfully!\n\nLogin credentials to share:\nPhone Number: ${sanitizedPhone}\nPassword: ${formData.password}`);
    } catch (error: any) {
      console.error('Error adding labour:', error);
      setError(error.message || 'Failed to add labour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Labour">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 text-sm text-red-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
          <input
            type="tel"
            required
            className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Labour Type</label>
            <select
              required
              className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={formData.labour_type}
              onChange={(e) => setFormData({ ...formData, labour_type: e.target.value })}
            >
              <option value="loading">Loading/Unloading</option>
              <option value="packing">Packing Staff</option>
              <option value="agrifresh">Agrifresh</option>
              <option value="import_export">Import/Export</option>
              <option value="hotel">Hotel Serving</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Wage Type</label>
            <select
              required
              className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={formData.wage_type}
              onChange={(e) => setFormData({ ...formData, wage_type: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Wage Amount (₹)</label>
          <input
            type="number"
            required
            className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={formData.wage_amount}
            onChange={(e) => setFormData({ ...formData, wage_amount: e.target.value })}
          />
        </div>

        <div className="pt-4 border-t border-stone-100">
          <h3 className="text-sm font-semibold text-stone-900 mb-3">Login Credentials</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
              <input
                type="text"
                required
                minLength={6}
                className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 6 chars"
              />
            </div>
          </div>
          <p className="text-xs text-stone-500 mt-2">These credentials will be used by the labourer to log into the app. Their username will be their phone number.</p>
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Labour
          </button>
        </div>
      </form>
    </Modal>
  );
};
