import React, { useState, useEffect } from 'react';
import { Shield, Users, Trash2, Key, Search, AlertTriangle, UserX, RefreshCw, Crown, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { User as UserType } from '../types';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { getAllUsersAdmin, deleteUserAdmin, resetPasswordAdmin, updateUserRoleAdmin } = useApp();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState<string | null>(null);
  const [showRoleChange, setShowRoleChange] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsersAdmin();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      setMessage('Cannot delete your own account');
      return;
    }

    setActionLoading(true);
    try {
      await deleteUserAdmin(userId);
      setMessage('User deleted successfully');
      setShowDeleteConfirm(null);
      loadUsers();
    } catch (error: any) {
      setMessage(error.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword.trim()) {
      setMessage('Please enter a new password');
      return;
    }

    setActionLoading(true);
    try {
      await resetPasswordAdmin(userId, newPassword);
      setMessage('Password reset successfully');
      setShowPasswordReset(null);
      setNewPassword('');
    } catch (error: any) {
      setMessage(error.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    if (userId === user?.id) {
      setMessage('Cannot change your own role');
      return;
    }

    setActionLoading(true);
    try {
      await updateUserRoleAdmin(userId, newRole);
      setMessage(`User role updated to ${newRole} successfully`);
      setShowRoleChange(null);
      loadUsers();
    } catch (error: any) {
      setMessage(error.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black/10 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black/10 backdrop-blur-sm">
        <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-700/50 p-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Shield className="w-6 h-6 text-red-500" />
                <span>Admin Panel</span>
              </h2>
              <p className="text-gray-400 text-sm">Manage users and system settings</p>
            </div>
            <button
              onClick={loadUsers}
              disabled={loading}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.includes('successfully') 
                ? 'bg-green-900/20 border border-green-500/30 text-green-400'
                : 'bg-red-900/20 border border-red-500/30 text-red-400'
            }`}>
              {message}
            </div>
          )}

          {/* Search and Stats */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by username, display name, or email..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{users.length}</p>
                    <p className="text-gray-400 text-sm">Total Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <Shield className="w-8 h-8 text-red-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</p>
                    <p className="text-gray-400 text-sm">Admins</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'user').length}</p>
                    <p className="text-gray-400 text-sm">Regular Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <Key className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{users.filter(u => u.twoFactorEnabled).length}</p>
                    <p className="text-gray-400 text-sm">2FA Enabled</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/50">
              <h3 className="text-lg font-bold text-white">User Management</h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="text-left p-4 text-gray-300 font-medium">User</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Email</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Role</th>
                      <th className="text-left p-4 text-gray-300 font-medium">2FA</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Joined</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-700/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={u.avatar}
                              alt={u.displayName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="text-white font-medium">{u.displayName}</p>
                              <p className="text-gray-400 text-sm">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-300">{u.email || 'N/A'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin' 
                              ? 'bg-red-900/30 text-red-400 border border-red-500/30'
                              : 'bg-gray-700/50 text-gray-300'
                          }`}>
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className={`w-3 h-3 rounded-full ${u.twoFactorEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </td>
                        <td className="p-4 text-gray-300 text-sm">
                          {u.createdAt.toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setShowRoleChange(u.id)}
                              disabled={u.id === user.id}
                              className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Change Role"
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowPasswordReset(u.id)}
                              disabled={u.id === user.id}
                              className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(u.id)}
                              disabled={u.id === user.id}
                              className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No users found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleChange && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl border border-gray-700/50 p-6 mx-4 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <Crown className="w-8 h-8 text-purple-500" />
              <h3 className="text-lg font-bold text-white">Change User Role</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Select the new role for this user. Admin users have full access to the admin panel and can manage other users.
            </p>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleRoleChange(showRoleChange, 'user')}
                disabled={actionLoading}
                className="w-full flex items-center space-x-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
              >
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Regular User</p>
                  <p className="text-gray-400 text-sm">Standard user access</p>
                </div>
              </button>
              <button
                onClick={() => handleRoleChange(showRoleChange, 'admin')}
                disabled={actionLoading}
                className="w-full flex items-center space-x-3 p-3 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 rounded-lg transition-colors text-left"
              >
                <Shield className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-white font-medium">Administrator</p>
                  <p className="text-gray-400 text-sm">Full admin access</p>
                </div>
              </button>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRoleChange(null)}
                disabled={actionLoading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl border border-gray-700/50 p-6 mx-4 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h3 className="text-lg font-bold text-white">Delete User</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this user? This action cannot be undone and will remove all their data.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                {actionLoading ? 'Deleting...' : 'Delete User'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={actionLoading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl border border-gray-700/50 p-6 mx-4 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <Key className="w-8 h-8 text-yellow-500" />
              <h3 className="text-lg font-bold text-white">Reset Password</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Enter new password"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleResetPassword(showPasswordReset)}
                  disabled={actionLoading || !newPassword.trim()}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  {actionLoading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordReset(null);
                    setNewPassword('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPage;