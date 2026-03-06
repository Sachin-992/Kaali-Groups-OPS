import React, { useState, useEffect } from 'react';
import { Truck, UserPlus, Search, Filter, MoreVertical, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { DeliveryPartner } from '../../types';
import { AddPartnerModal } from './AddPartnerModal';

export const DeliveryPartnerList: React.FC = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, profileId: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPartners();
    
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_partners')
        .select(`
          *,
          profiles:profile_id (full_name, email, phone_number)
        `);

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, profileId: string) => {
    setDeleteConfirm({ id, profileId });
    setActiveDropdown(null);
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      // Delete from delivery_partners
      const { error: partnerError } = await supabase
        .from('delivery_partners')
        .delete()
        .eq('id', deleteConfirm.id);
        
      if (partnerError) throw partnerError;
      
      // Delete from profiles (which will cascade to auth.users if set up, or just remove the profile)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteConfirm.profileId);
        
      if (profileError) throw profileError;
      
      fetchPartners();
    } catch (error: any) {
      console.error('Error deleting partner:', error);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const filteredPartners = partners.filter((partner) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (partner.profiles?.full_name?.toLowerCase() || '').includes(searchLower) ||
      (partner.vehicle_number?.toLowerCase() || '').includes(searchLower) ||
      (partner.profiles?.phone_number?.toLowerCase() || '').includes(searchLower) ||
      (partner.profiles?.email?.toLowerCase() || '').includes(searchLower);
    
    const matchesStatus = filterStatus === 'all' || partner.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Delivery Partners</h1>
          <p className="text-stone-500">Manage fleet and partner profiles</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Add New Partner
        </button>
      </div>

      <AddPartnerModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchPartners} 
      />

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by name, vehicle, or phone..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[200px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Partner Name</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Vehicle Number</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">Loading partners...</td>
                </tr>
              ) : filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">No delivery partners found.</td>
                </tr>
              ) : (
                filteredPartners.map((partner: any) => (
                  <tr key={partner.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 font-bold text-xs">
                          {partner.profiles?.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-900">{partner.profiles?.full_name}</p>
                          <p className="text-xs text-stone-500">{partner.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-stone-400" />
                        <span className="text-sm text-stone-600 font-mono">{partner.vehicle_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-stone-600">{partner.profiles?.phone_number || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        partner.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {partner.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === partner.id ? null : partner.id);
                        }}
                        className="p-1 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {activeDropdown === partner.id && (
                        <div className="absolute right-6 top-10 mt-1 w-36 bg-white rounded-xl shadow-lg border border-stone-100 z-10 py-1">
                          <button
                            onClick={() => handleDeleteClick(partner.id, partner.profile_id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold text-stone-900 mb-2">Delete Partner</h3>
            <p className="text-stone-500 mb-6">Are you sure you want to delete this delivery partner? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
