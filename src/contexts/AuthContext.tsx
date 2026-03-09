import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { activateFreeTrial } from '@/services/trialService';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  property_type?: string;
  number_of_beds: number;
  bed_count?: number;
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at?: string;
  email_verified?: boolean;
  email_verified_at?: string;
  verification_token?: string;
  verification_token_expires_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWith2FA: (email: string, password: string, totpCode?: string, backupCode?: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (newPassword: string) => Promise<any>;
  updateProfile: (updates: Partial<Profile>) => Promise<any>;
  resendEmailVerification: () => Promise<any>;
  logSessionActivity: (action: string, metadata?: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
  requires2FA: boolean;
  set2FARequired: (required: boolean) => void;
  isPasswordRecovery: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);

      setSession(session);
      setUser(session?.user ?? null);

      // Handle password recovery event
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        console.log('Password recovery mode activated');
      }

      if (session?.user) {
        await fetchProfile(session.user.id);
        // Check trial expiration on auth state change
        await checkAndUpdateTrialStatus(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAndUpdateTrialStatus = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_ends_at, subscription_status')
        .eq('id', userId)
        .single();

      if (profile?.subscription_status === 'trial' && profile.trial_ends_at) {
        const now = new Date();
        const trialEnd = new Date(profile.trial_ends_at);

        if (now > trialEnd) {
          // Trial expired, update status
          await supabase
            .from('profiles')
            .update({ subscription_status: 'expired' })
            .eq('id', userId);

          // Refresh profile
          await fetchProfile(userId);
        }
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: userData } = await supabase.auth.getUser();
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userData.user?.email || '',
              subscription_tier: 'free',
              subscription_status: 'trial',
              number_of_beds: 1,
              bed_count: 1,
              trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else if (newProfile) {
            setProfile(newProfile);
          }
          return;
        }
        throw error;
      }
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Starting signup process for:', email);

      // Generate verification token
      const verificationToken = Math.random().toString(36).substring(2, 15) +
                               Math.random().toString(36).substring(2, 15);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        return { data, error };
      }

      console.log('Signup successful, user created:', data.user?.id);

      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify profile was created
      if (data.user) {
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // If profile doesn't exist, create it manually as a fallback
        if (profileError && profileError.code === 'PGRST116') {
          console.log('Profile not created by trigger, creating manually...');

          const tokenExpiresAt = new Date();
          tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: fullName,
              subscription_tier: 'free',
              subscription_status: 'trial',
              number_of_beds: 1,
              bed_count: 1,
              trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              email_verified: false,
              verification_token: verificationToken,
              verification_token_expires_at: tokenExpiresAt.toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('Failed to create profile manually:', createError);
          } else {
            console.log('Profile created successfully via fallback:', newProfile);
            profileData = newProfile;
            profileError = null;
          }
        }

        if (profileData) {
          console.log('Profile verified successfully:', profileData);
          setProfile(profileData);

          // Send verification email
          try {
            const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
              body: {
                to: data.user.email,
                token: profileData.verification_token || verificationToken,
                userName: fullName,
                action: 'send'
              }
            });

            if (emailError) {
              console.error('Failed to send verification email:', emailError);
            } else {
              console.log('Verification email sent');
            }
          } catch (emailErr) {
            console.error('Error sending verification email:', emailErr);
          }

          // Activate free trial
          try {
            await activateFreeTrial(data.user.id);
            console.log('Free trial activated');
          } catch (trialError) {
            console.error('Failed to activate free trial:', trialError);
          }
        }
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Unexpected signup error:', err);
      return {
        data: null,
        error: { message: err.message || 'An unexpected error occurred during signup' }
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signInWith2FA = async (email: string, password: string, totpCode?: string, backupCode?: string) => {
    // First, try regular sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return { data, error };

    // Successfully signed in - 2FA check is optional
    setRequires2FA(false);
    return { data, error: null };
  };

  const signOut = async () => {
    setRequires2FA(false);
    setIsPasswordRecovery(false);
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const siteUrl = window.location.origin;
      const redirectTo = `${siteUrl}/reset-password`;

      console.log('Sending password reset email to:', email);
      console.log('Redirect URL:', redirectTo);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo
      });

      if (error) {
        console.error('Password reset error:', error);
        return { data: null, error };
      }

      console.log('Password reset email sent successfully');
      return { data: { success: true, message: 'Password reset email sent' }, error: null };
    } catch (err: any) {
      console.error('Unexpected password reset error:', err);
      return { data: null, error: { message: err.message || 'Failed to send reset email' } };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      console.log('Updating password...');

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        return { data: null, error };
      }

      console.log('Password updated successfully');
      setIsPasswordRecovery(false);

      return { data: { success: true, message: 'Password updated successfully' }, error: null };
    } catch (err: any) {
      console.error('Unexpected password update error:', err);
      return { data: null, error: { message: err.message || 'Failed to update password' } };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    return { data, error };
  };

  const resendEmailVerification = async () => {
    if (!user) return { error: 'No user logged in' };

    try {
      // Call the database function to generate new token
      const { data, error } = await supabase.rpc('resend_verification_email', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data?.success && data?.token) {
        // Send the actual email via edge function
        const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
          body: {
            to: user.email,
            token: data.token,
            userName: profile?.full_name,
            action: 'resend'
          }
        });

        if (emailError) throw emailError;

        return { data: { success: true, message: 'Verification email sent' }, error: null };
      } else {
        throw new Error(data?.error || 'Failed to resend verification email');
      }
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  };

  const logSessionActivity = async (action: string, metadata?: any) => {
    if (!user) return;

    try {
      await supabase.functions.invoke('user-role-manager', {
        body: {
          action: 'log_session',
          sessionAction: action,
          ipAddress: null,
          userAgent: navigator.userAgent,
          location: metadata
        }
      });
    } catch (error) {
      console.error('Failed to log session activity:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signInWith2FA,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    resendEmailVerification,
    logSessionActivity,
    refreshProfile,
    requires2FA,
    set2FARequired: setRequires2FA,
    isPasswordRecovery
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
