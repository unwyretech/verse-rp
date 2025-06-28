import React, { useState } from 'react';
import { Shield, Lock, Bell, Eye, User, Smartphone, Key, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage: React.FC = () => {
  const { user, updateUser, enableTwoFactor, changePassword } = useAuth();
  const [activeSection, setActiveSection] = useState('privacy');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    email: user?.email || '',
    otpCode: '',
    username: user?.username || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sections = [
    { key: 'privacy', label: 'Privacy & Safety', icon: Shield },
    { key: 'account', label: 'Account', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      setMessage('Password changed successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      setMessage(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = async () => {
    if (!formData.username.trim()) {
      setMessage('Username cannot be empty');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await updateUser({ username: formData.username });
      setMessage('Username updated successfully');
    } catch (error: any) {
      setMessage(error.message || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (formData.email) {
      await enableTwoFactor(formData.email);
    }
  };

  const handlePrivacyUpdate = (setting: string, value: any) => {
    if (user) {
      updateUser({
        privacySettings: {
          ...user.privacySettings,
          [setting]: value
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-black/10 backdrop-blur-sm">
      <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-700/50 p-4 z-10">
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-gray-400 text-sm">Manage your account and privacy preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row min-h-0">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64 border-b lg:border-r lg:border-b-0 border-gray-700/50 bg-black/20 p-4">
          <nav className="space-y-2">
            {sections.map(section => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  activeSection === section.key
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <section.icon className="w-5 h-5" />
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.includes('successfully') 
                ? 'bg-green-900/20 border border-green-500/30 text-green-400'
                : 'bg-red-900/20 border border-red-500/30 text-red-400'
            }`}>
              {message}
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  <span>Profile Visibility</span>
                </h3>
                <div className="space-y-4">
                  {[
                    { value: 'public', label: 'Public', desc: 'Anyone can see your profile' },
                    { value: 'followers', label: 'Followers Only', desc: 'Only your followers can see your profile' },
                    { value: 'private', label: 'Private', desc: 'Only you can see your profile' }
                  ].map(option => (
                    <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="profileVisibility"
                        value={option.value}
                        checked={user?.privacySettings.profileVisibility === option.value}
                        onChange={(e) => handlePrivacyUpdate('profileVisibility', e.target.value)}
                        className="text-purple-600 focus:ring-purple-500 mt-1"
                      />
                      <div>
                        <p className="text-white font-medium">{option.label}</p>
                        <p className="text-gray-400 text-sm">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-bold text-white mb-4">Message Permissions</h3>
                <div className="space-y-4">
                  {[
                    { value: 'everyone', label: 'Everyone', desc: 'Anyone can send you messages' },
                    { value: 'followers', label: 'Followers Only', desc: 'Only your followers can message you' },
                    { value: 'none', label: 'No One', desc: 'Disable direct messages' }
                  ].map(option => (
                    <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="messagePermissions"
                        value={option.value}
                        checked={user?.privacySettings.messagePermissions === option.value}
                        onChange={(e) => handlePrivacyUpdate('messagePermissions', e.target.value)}
                        className="text-purple-600 focus:ring-purple-500 mt-1"
                      />
                      <div>
                        <p className="text-white font-medium">{option.label}</p>
                        <p className="text-gray-400 text-sm">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      />
                      <button
                        onClick={handleUsernameChange}
                        disabled={loading || formData.username === user?.username}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={user?.displayName}
                      onChange={(e) => updateUser({ displayName: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Writer's Tag</label>
                    <input
                      type="text"
                      value={user?.writersTag}
                      onChange={(e) => updateUser({ writersTag: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                    <textarea
                      value={user?.bio}
                      onChange={(e) => updateUser({ bio: e.target.value })}
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <Key className="w-5 h-5 text-purple-400" />
                  <span>Change Password</span>
                </h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-purple-400" />
                  <span>Two-Factor Authentication</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">2FA Status</p>
                      <p className="text-gray-400 text-sm">
                        {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${user?.twoFactorEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                  {!user?.twoFactorEnabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email for 2FA</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                          placeholder="your@email.com"
                        />
                      </div>
                      <button
                        onClick={handleEnable2FA}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                      >
                        Enable 2FA
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-bold text-white mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Tag Notifications</p>
                      <p className="text-gray-400 text-sm">Get notified when someone mentions you</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={user?.privacySettings.tagNotifications}
                        onChange={(e) => handlePrivacyUpdate('tagNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Direct Message Notifications</p>
                      <p className="text-gray-400 text-sm">Get notified about new messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={user?.privacySettings.directMessageNotifications}
                        onChange={(e) => handlePrivacyUpdate('directMessageNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;