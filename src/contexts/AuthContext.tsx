import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, encryptData, decryptData, hashData } from '../lib/supabase';
import { User, AuthState } from '../types';
import bcrypt from 'bcryptjs';

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, displayName: string, writersTag: string, email: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  verifyOTP: (code: string) => Promise<boolean>;
  enableTwoFactor: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          characters(id),
          privacy_settings(*)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      const user: User = {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        email: profile.email,
        avatar: profile.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
        headerImage: profile.header_image_url || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
        bio: profile.bio,
        writersTag: profile.writers_tag,
        twoFactorEnabled: profile.two_factor_enabled,
        characters: profile.characters?.map((c: any) => c.id) || [],
        followers: profile.followers || [],
        following: profile.following || [],
        createdAt: new Date(profile.created_at),
        privacySettings: profile.privacy_settings?.[0] ? {
          profileVisibility: profile.privacy_settings[0].profile_visibility,
          messagePermissions: profile.privacy_settings[0].message_permissions,
          tagNotifications: profile.privacy_settings[0].tag_notifications,
          directMessageNotifications: profile.privacy_settings[0].direct_message_notifications
        } : {
          profileVisibility: 'public',
          messagePermissions: 'everyone',
          tagNotifications: true,
          directMessageNotifications: true
        }
      };

      setAuthState({
        isAuthenticated: true,
        user,
        loading: false
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      // Check if identifier is email or username
      const isEmail = identifier.includes('@');
      
      let email = identifier;
      if (!isEmail) {
        // Get email from username with proper error handling
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', identifier)
            .maybeSingle();
          
          if (error) {
            console.error('Profile lookup error:', error);
            throw new Error('Database error occurred');
          }
          
          if (!profile || !profile.email) {
            throw new Error('User not found or no email associated with username');
          }
          
          email = profile.email;
        } catch (dbError) {
          console.error('Database query failed:', dbError);
          throw new Error('Unable to find user. Please check your username or try using your email address.');
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Auth error:', error);
        throw new Error(error.message || 'Login failed');
      }

      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Re-throw to let the UI handle the error message
    }
  };

  const register = async (
    username: string, 
    password: string, 
    displayName: string, 
    writersTag: string,
    email: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        console.error('Auth signup error:', error);
        throw new Error(error.message || 'Registration failed');
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username,
            display_name: displayName,
            email,
            writers_tag: writersTag,
            bio: 'New to CharacterVerse!'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Provide more specific error messages based on the error code
          if (profileError.code === '23505') {
            if (profileError.message.includes('username')) {
              throw new Error('Username already exists. Please choose a different username.');
            } else {
              throw new Error('This account already exists. Please try logging in instead.');
            }
          }
          throw new Error(profileError.message || 'Failed to create user profile');
        }

        // Create default privacy settings
        const { error: privacyError } = await supabase
          .from('privacy_settings')
          .insert({
            user_id: data.user.id,
            profile_visibility: 'public',
            message_permissions: 'everyone',
            tag_notifications: true,
            direct_message_notifications: true
          });

        if (privacyError) console.warn('Privacy settings creation failed:', privacyError);
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      // Re-throw the error to let the UI handle it
      throw error;
    }
  };

  const logout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!authState.user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.displayName,
          bio: updates.bio,
          writers_tag: updates.writersTag,
          email: updates.email,
          avatar_url: updates.avatar,
          header_image_url: updates.headerImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', authState.user.id);

      if (error) throw error;

      // Update privacy settings separately if provided
      if (updates.privacySettings) {
        const { error: privacyError } = await supabase
          .from('privacy_settings')
          .update({
            profile_visibility: updates.privacySettings.profileVisibility,
            message_permissions: updates.privacySettings.messagePermissions,
            tag_notifications: updates.privacySettings.tagNotifications,
            direct_message_notifications: updates.privacySettings.directMessageNotifications,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', authState.user.id);

        if (privacyError) console.warn('Privacy settings update failed:', privacyError);
      }

      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null
      }));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const verifyOTP = async (code: string): Promise<boolean> => {
    // Mock OTP verification
    return code === '123456';
  };

  const enableTwoFactor = async (email: string): Promise<boolean> => {
    if (authState.user) {
      await updateUser({ email, twoFactorEnabled: true });
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      register,
      logout,
      updateUser,
      verifyOTP,
      enableTwoFactor
    }}>
      {children}
    </AuthContext.Provider>
  );
};