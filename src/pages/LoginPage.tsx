import React, { useState } from 'react';
import { Feather, Eye, EyeOff, Shield, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    identifier: '', // Can be username or email
    password: '',
    displayName: '',
    writersTag: '',
    email: '',
    otp: ''
  });

  const { login, register, verifyOTP, enableTwoFactor } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (showOTP) {
        const success = await verifyOTP(formData.otp);
        if (success) {
          setShowOTP(false);
        } else {
          setError('Invalid verification code');
        }
      } else if (isLogin) {
        await login(formData.identifier, formData.password);
      } else {
        // Extract username from identifier for registration
        const username = formData.identifier.includes('@') 
          ? formData.identifier.split('@')[0] 
          : formData.identifier;
        
        await register(
          username, 
          formData.password, 
          formData.displayName, 
          formData.writersTag,
          formData.email
        );
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (formData.email) {
      setLoading(true);
      try {
        await enableTwoFactor(formData.email);
        setShowOTP(true);
      } catch (error) {
        console.error('2FA setup error:', error);
        setError('Failed to setup 2FA');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLocalTestLogin = () => {
    setLoading(true);
    
    // Create a local test user and bypass authentication
    const testUser = {
      id: 'local-test-user',
      username: 'test_user',
      displayName: 'Test User',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
      headerImage: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
      bio: 'Local test user for development',
      writersTag: 'testing',
      email: 'test@local.dev',
      twoFactorEnabled: false,
      characters: [],
      followers: [],
      following: [],
      createdAt: new Date().toISOString(),
      privacySettings: {
        profileVisibility: 'public' as const,
        messagePermissions: 'everyone' as const,
        tagNotifications: true,
        directMessageNotifications: true
      }
    };

    // Store in localStorage to persist across page reloads
    localStorage.setItem('localTestUser', JSON.stringify(testUser));
    
    // Trigger a page reload to let the auth context pick up the local user
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Feather className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">CharacterVerse</h1>
            <p className="text-gray-400">
              {showOTP ? 'Enter verification code' : isLogin ? 'Welcome back' : 'Join the community'}
            </p>
          </div>

          {/* Demo Credentials */}
          {isLogin && !showOTP && (
            <div className="mb-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <h3 className="text-purple-300 font-semibold mb-2">Demo Accounts:</h3>
              <div className="space-y-1 text-sm text-gray-300">
                <p><strong>Username:</strong> alice_writer | <strong>Password:</strong> password123</p>
                <p><strong>Username:</strong> bob_scifi | <strong>Password:</strong> password123</p>
                <p><strong>Username:</strong> carol_modern | <strong>Password:</strong> password123</p>
                <p><strong>Username:</strong> david_marvel | <strong>Password:</strong> password123</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {showOTP ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={formData.otp}
                  onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {isLogin ? 'Username or Email' : 'Username'}
                  </label>
                  <input
                    type="text"
                    value={formData.identifier}
                    onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    placeholder={isLogin ? "Enter username or email" : "Choose a username"}
                    required
                  />
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Your display name"
                      required
                    />
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Writer's Tag
                    </label>
                    <input
                      type="text"
                      value={formData.writersTag}
                      onChange={(e) => setFormData(prev => ({ ...prev, writersTag: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="e.g., fantasy, scifi, modern"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="your@email.com"
                        required
                      />
                      {formData.email && (
                        <button
                          type="button"
                          onClick={handleEnable2FA}
                          className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                        >
                          <Shield className="w-4 h-4" />
                          <span>2FA</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : showOTP ? 'Verify Code' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {!showOTP && (
            <div className="mt-6 space-y-4">
              <div className="text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setFormData({
                      identifier: '',
                      password: '',
                      displayName: '',
                      writersTag: '',
                      email: '',
                      otp: ''
                    });
                  }}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>

              {/* Local Test Profile Button */}
              <div className="border-t border-gray-700/50 pt-4">
                <button
                  onClick={handleLocalTestLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium py-3 rounded-lg transition-all duration-200 border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <User className="w-5 h-5" />
                  <span>Continue with Local Test Profile</span>
                </button>
                <p className="text-gray-500 text-xs text-center mt-2">
                  For development and testing purposes
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;