import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eexdqxdasxkbhwfmtmeg.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVleGRxeDRhc3hrYmh3Zm10bWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDU5NDYsImV4cCI6MjA4ODEyMTk0Nn0.3T4xVTM7d4XDUlwMXLrio0u4PwvlFMEDCBpnmwaiY5A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
