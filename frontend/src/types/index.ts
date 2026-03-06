export type UserRole = 'admin' | 'delivery_partner' | 'labour' | 'manager';

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
  avatar_url?: string;
  created_at: string;
}

export interface DeliveryPartner {
  id: string;
  profile_id: string;
  vehicle_number: string;
  status: 'active' | 'inactive';
  opening_balance: number;
}

export interface PetrolExpense {
  id: string;
  partner_id: string;
  date: string;
  bunk_name: string;
  amount: number;
  vehicle_number: string;
  km_reading?: number;
  bill_image_url: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Labour {
  id: string;
  profile_id: string;
  labour_type: 'agrifresh' | 'import_export' | 'hotel' | 'packing' | 'loading';
  wage_type: 'daily' | 'monthly';
  wage_amount: number;
  status: 'active' | 'inactive';
}

export interface Attendance {
  id: string;
  labour_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'absent' | 'half_day';
}

export interface Settlement {
  id: string;
  partner_id: string;
  date: string;
  cod_collected: number;
  petrol_expense: number;
  other_expenses: number;
  final_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  reference_id?: string; // ID of the related settlement, petrol expense, etc.
}
