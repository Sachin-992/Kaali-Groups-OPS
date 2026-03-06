-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'delivery_partner', 'labour')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create delivery_partners table
CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vehicle_number TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  opening_balance DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create labour table
CREATE TABLE IF NOT EXISTS public.labour (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  labour_type TEXT CHECK (labour_type IN ('agrifresh', 'import_export', 'hotel', 'packing', 'loading')),
  wage_type TEXT CHECK (wage_type IN ('daily', 'monthly')),
  wage_amount DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create petrol_expenses table
CREATE TABLE IF NOT EXISTS public.petrol_expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  partner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  bunk_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  vehicle_number TEXT NOT NULL,
  km_reading INTEGER,
  bill_image_url TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT CHECK (status IN ('present', 'absent', 'half_day')) DEFAULT 'absent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, date)
);

-- Create settlements table
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  partner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  cod_collected DECIMAL(10, 2) DEFAULT 0,
  petrol_expense DECIMAL(10, 2) DEFAULT 0,
  other_expenses DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) GENERATED ALWAYS AS (cod_collected - petrol_expense - other_expenses) STORED,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labour ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petrol_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified for development)
-- Allow read access to all authenticated users
CREATE POLICY "Allow read access for authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access for authenticated users" ON public.delivery_partners FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access for authenticated users" ON public.labour FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access for authenticated users" ON public.petrol_expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access for authenticated users" ON public.attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access for authenticated users" ON public.settlements FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert/update/delete for authenticated users (simplified)
-- In production, you'd want stricter policies based on role
CREATE POLICY "Allow all access for authenticated users" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all access for authenticated users" ON public.delivery_partners FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all access for authenticated users" ON public.labour FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all access for authenticated users" ON public.petrol_expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all access for authenticated users" ON public.attendance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all access for authenticated users" ON public.settlements FOR ALL USING (auth.role() = 'authenticated');

-- Create a trigger to automatically create a profile for new users (optional, but good practice)
-- This handles users created via Auth UI, but our manual creation handles it explicitly too.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'delivery_partner'))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
