import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, encryptData, decryptData, hashData } from '../lib/supabase';
import { User, AuthState } from '../types';
import bcrypt from 'bcryptjs';

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, displayName: string, writersTag: string, email: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  verifyOTP: (code: string) => Promise<boolean>;
  enableTwoFactor: (email: string) => Promise<boolean>;
  refreshSession: () => Promise<void>;
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

  // Session refresh interval
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (authState.isAuthenticated) {
      // Refresh session every 30 minutes
      refreshInterval = setInterval(() => {
        refreshSession();
      }, 30 * 60 * 1000);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [authState.isAuthenticated]);

  useEffect(() => {
    let mounted = true;

    // Check for existing session with timeout
    const checkSession = async () => {
      try {
        // Set a timeout for the session check - increased to 30 seconds
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 30000)
        );

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (error) {
          console.error('Session check error:', error);
          if (mounted) {
            setAuthState({
              isAuthenticated: false,
              user: null,
              loading: false
            });
          }
          return;
        }

        if (session?.user && mounted) {
          // Verify session is still valid
          const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !currentUser) {
            console.warn('Session invalid, logging out');
            await supabase.auth.signOut();
            if (mounted) {
              setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false
              });
            }
            return;
          }

          await loadUserProfile(session.user.id);
        } else if (mounted) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false
          });
        }
      } catch (error) {
        console.error('Session check failed:', error);
        if (mounted) {
          // Clear any invalid session data
          await supabase.auth.signOut();
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false
          });
        }
      }
    };

    checkSession();

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Verify the refreshed session
          const { data: { user: currentUser }, error } = await supabase.auth.getUser();
          if (error || !currentUser) {
            console.warn('Token refresh failed, logging out');
            await supabase.auth.signOut();
            setAuthState({
              isAuthenticated: false,
              user: null,
              loading: false
            });
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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

      if (error) {
        console.error('Profile load error:', error);
        // If profile doesn't exist or can't be loaded, sign out
        await supabase.auth.signOut();
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
        return;
      }

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
        role: profile.role || 'user',
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
      await supabase.auth.signOut();
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        // If refresh fails, sign out
        await supabase.auth.signOut();
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
        return;
      }

      if (!session) {
        console.warn('No session after refresh');
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      await supabase.auth.signOut();
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  };

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

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
        setAuthState(prev => ({ ...prev, loading: false }));
        throw new Error(error.message || 'Login failed');
      }

      // Don't set loading to false here - let the auth state change handler do it
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
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
      setAuthState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        console.error('Auth signup error:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
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
            bio: 'New to CharacterVerse!',
            role: 'user'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          setAuthState(prev => ({ ...prev, loading: false }));
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

      // Don't set loading to false here - let the auth state change handler do it
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      await supabase.auth.signOut();
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!authState.user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: updates.username,
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
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password change error:', error);
        throw new Error(error.message || 'Failed to change password');
      }

      return true;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
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
      changePassword,
      verifyOTP,
      enableTwoFactor,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};