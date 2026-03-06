import React, { useState } from 'react';
import { Fuel, Camera, Upload, Loader2, CheckCircle, ArrowLeft, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { getLocalDateString } from '../../utils/dateUtils';

export const PetrolExpenseForm: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    vehicle_number: '',
    bunk_name: '',
    km_reading: '',
    date: getLocalDateString(),
  });
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let bill_image_url = '';

      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `petrol-bills/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('operations')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('operations')
          .getPublicUrl(filePath);
        
        bill_image_url = publicUrl;
      }

      const { error } = await supabase
        .from('petrol_expenses')
        .insert({
          partner_id: profile?.id,
          amount: parseFloat(formData.amount),
          vehicle_number: formData.vehicle_number,
          bunk_name: formData.bunk_name,
          km_reading: formData.km_reading ? parseInt(formData.km_reading) : null,
          date: formData.date,
          bill_image_url,
          status: 'pending'
        });

      if (error) throw error;

      setSuccess(true);
      setFormData({
        amount: '',
        vehicle_number: '',
        bunk_name: '',
        km_reading: '',
        date: getLocalDateString(),
      });
      removeImage();
    } catch (error: any) {
      console.error('Error logging expense:', error);
      setError(error.message || 'Failed to log petrol expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm text-center max-w-md mx-auto mt-10"
      >
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Expense Logged!</h2>
        <p className="text-stone-500 mb-8">Your petrol expense has been submitted successfully and is pending approval.</p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setSuccess(false)}
            className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors"
          >
            Log Another Expense
          </button>
          {onBack && (
            <button 
              onClick={onBack}
              className="w-full py-3 bg-white text-stone-600 border border-stone-200 rounded-xl font-bold hover:bg-stone-50 transition-colors"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-stone-100 rounded-full text-stone-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Fuel className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">Log Petrol Expense</h2>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-start"
            >
              <div className="mr-3 mt-0.5">
                <XCircle className="w-4 h-4" />
              </div>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-stone-700">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₹</span>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-lg font-medium"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-stone-700">Vehicle Number</label>
              <input
                type="text"
                required
                placeholder="e.g. TN 24 AB 1234"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all uppercase"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-stone-700">Petrol Bunk Name</label>
              <input
                type="text"
                required
                placeholder="Enter bunk name"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                value={formData.bunk_name}
                onChange={(e) => setFormData({ ...formData, bunk_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-stone-700">
                KM Reading <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                placeholder="Current odometer reading"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                value={formData.km_reading}
                onChange={(e) => setFormData({ ...formData, km_reading: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-stone-700">Bill Image</label>
            <div 
              className={`mt-1 border-2 border-dashed rounded-xl transition-all relative overflow-hidden min-h-[200px] flex flex-col items-center justify-center ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' 
                  : previewUrl 
                    ? 'border-emerald-500 bg-emerald-50/30' 
                    : 'border-stone-300 hover:border-emerald-400 hover:bg-stone-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleImageChange}
              />
              
              {previewUrl ? (
                <div className="relative p-4 flex flex-col items-center justify-center w-full h-full">
                  <img 
                    src={previewUrl} 
                    alt="Bill preview" 
                    className="max-h-[250px] rounded-lg shadow-sm object-contain" 
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      // Prevent event bubbling to the file input
                      e.stopPropagation();
                      removeImage();
                    }}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md text-stone-500 hover:text-red-500 z-20 hover:scale-110 transition-transform"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="mt-3 flex items-center text-emerald-600 text-sm font-medium bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Image selected
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center pointer-events-none">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                    isDragging ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-400'
                  }`}>
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="text-base font-medium text-stone-900 mb-1">
                    {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-stone-500">
                    PNG, JPG, JPEG (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Submit Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function XCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

