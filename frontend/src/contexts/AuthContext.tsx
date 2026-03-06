import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist but it's the developer email, create it in the DB
        if (email === 'sachinchinnasamy2021@gmail.com') {
          console.log('Developer profile not found, attempting to create...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              full_name: 'Developer Admin',
              email: email,
              role: 'admin'
            }, { onConflict: 'id' })
            .select()
            .single();
            
          if (createError) {
            console.error('CRITICAL: Failed to create developer admin profile:', createError);
            // Do NOT fallback to mock here, as it causes FK errors downstream.
            // Instead, let the user know something is wrong.
            alert(`Failed to initialize admin profile. Database error: ${createError.message}`);
            throw createError;
          }

          if (newProfile) {
            console.log('Developer admin profile created successfully.');
            setProfile(newProfile);
            return;
          }
        }
        throw error;
      }

      // If profile exists but it's the developer email, ensure it has admin role for development
      if (email === 'sachinchinnasamy2021@gmail.com' && data) {
        if (data.role !== 'admin') {
           // Auto-fix role if needed
           await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
           setProfile({ ...data, role: 'admin' });
        } else {
           setProfile(data);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // We do NOT set a mock profile anymore to avoid FK constraints issues.
      // The UI will likely show a loading state or empty state, which is better than a broken state.
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
