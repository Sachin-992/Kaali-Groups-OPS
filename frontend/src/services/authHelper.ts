import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './supabase';

// Create a single instance of the client for auth operations to avoid warnings
// about multiple GoTrueClient instances.
const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

/**
 * Creates a new user in Supabase Auth using a temporary client instance.
 * This avoids signing out the current admin user.
 * 
 * @param phone User's phone number
 * @param password Temporary password
 * @param metadata Optional user metadata
 * @returns The created user object or throws an error
 */
export const createNewUser = async (phone: string, password = 'TempPassword123!', metadata = {}) => {
  console.log('Attempting to create user with phone:', phone);
  // Use the singleton tempClient
  const { data, error } = await tempClient.auth.signUp({
    phone,
    password,
    options: {
      data: metadata
    }
  });

  if (error) {
    console.error('Supabase Auth Error:', error);
    throw error;
  }

  return data.user;
};
