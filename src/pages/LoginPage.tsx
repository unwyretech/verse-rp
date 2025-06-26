import React, { useState } from 'react';
import { Feather, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    identifier: '', // Can be username or email
    password: '',
    displayName: '',
    writersTag: '',
    email: ''
  });

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Feather className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">VERSE</h1>
              <p className="text-gray-400">
                {isLogin ? 'Welcome back to the community' : 'Join the storytelling community'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                <>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </>
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

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({
                    identifier: '',
                    password: '',
                    displayName: '',
                    writersTag: '',
                    email: ''
                  });
                }}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center border-t border-gray-700/50 bg-black/20">
        <p className="text-gray-500 text-sm">
          Verse © {new Date().getFullYear()} - UNWYRE TECH AND CONSULTING
        </p>
      </div>
    </div>
  );
};

export default LoginPage;