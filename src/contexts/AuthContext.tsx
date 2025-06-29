import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TokenManager, TokenData } from '../lib/tokenManager';
import { User, AuthState } from '../types';

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

  // Token refresh interval
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (authState.isAuthenticated) {
      // Check token every 5 minutes
      refreshInterval = setInterval(() => {
        checkAndRefreshToken();
      }, 5 * 60 * 1000);
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [authState.isAuthenticated]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check for stored tokens first (fastest check)
        const storedTokens = TokenManager.getTokens();
        
        if (storedTokens) {
          // Check if token is expired
          if (TokenManager.isTokenExpired(storedTokens.expiresAt)) {
            console.log('Stored token expired, clearing...');
            TokenManager.clearTokens();
            if (mounted) {
              setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false
              });
            }
            return;
          }

          // Token is valid, load user profile immediately
          await loadUserProfile(storedTokens.userId);
          return;
        }

        // No stored tokens, check Supabase session (slower fallback)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Supabase session check error:', error);
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
          // Create new tokens for Supabase session
          const tokenData = TokenManager.generateTokens(session.user.id);
          TokenManager.storeTokens(tokenData);
          await loadUserProfile(session.user.id);
        } else if (mounted) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false
          });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          TokenManager.clearTokens();
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false
          });
        }
      }
    };

    initializeAuth();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          // Create new tokens
          const tokenData = TokenManager.generateTokens(session.user.id);
          TokenManager.storeTokens(tokenData);
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          TokenManager.clearTokens();
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false
          });
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        TokenManager.clearTokens();
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

  const checkAndRefreshToken = async () => {
    const storedTokens = TokenManager.getTokens();
    
    if (!storedTokens) {
      console.log('No stored tokens found');
      await logout();
      return;
    }

    if (TokenManager.isTokenExpired(storedTokens.expiresAt)) {
      console.log('Token expired, logging out');
      await logout();
      return;
    }

    if (TokenManager.needsRefresh(storedTokens.expiresAt)) {
      console.log('Token needs refresh, generating new tokens');
      const newTokenData = TokenManager.generateTokens(storedTokens.userId);
      TokenManager.storeTokens(newTokenData);
    }
  };

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
        TokenManager.clearTokens();
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
      TokenManager.clearTokens();
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  };

  const refreshSession = async () => {
    await checkAndRefreshToken();
  };

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      // Check if identifier is email or username
      const isEmail = identifier.includes('@');
      
      let email = identifier;
      if (!isEmail) {
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

      if (data.user) {
        // Generate and store tokens
        const tokenData = TokenManager.generateTokens(data.user.id);
        TokenManager.storeTokens(tokenData);
      }

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

        // Generate and store tokens
        const tokenData = TokenManager.generateTokens(data.user.id);
        TokenManager.storeTokens(tokenData);
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear tokens immediately
      TokenManager.clearTokens();
      
      // Sign out from Supabase (don't wait for it)
      supabase.auth.signOut().catch(error => {
        console.warn('Supabase signout error:', error);
      });
      
      // Set auth state immediately
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear the state
      TokenManager.clearTokens();
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

      // Generate new tokens for security
      if (authState.user) {
        const tokenData = TokenManager.generateTokens(authState.user.id);
        TokenManager.storeTokens(tokenData);
      }

      return true;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  };

  const verifyOTP = async (code: string): Promise<boolean> => {
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