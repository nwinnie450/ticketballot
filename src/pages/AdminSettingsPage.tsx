import { useState, useEffect } from 'react';
import { useBallot } from '../hooks/useBallot';
import { authService } from '../services/authService';

interface AdminSettingsPageProps {
  onNavigate: (page: string) => void;
}

export function AdminSettingsPage({ onNavigate }: AdminSettingsPageProps) {
  const { clearBallotData } = useBallot();
  const [activeTab, setActiveTab] = useState<'password' | 'admins' | 'system'>('password');
  const [admins, setAdmins] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Add admin form
  const [newUsername, setNewUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const adminList = authService.getAdmins();
      const stats = authService.getAdminStats();
      setAdmins(adminList);
      setAdminStats(stats);
    } catch (err) {
      setError('Failed to load admin data');
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      authService.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      authService.addAdmin(newUsername, newAdminPassword);
      setSuccess(`Admin '${newUsername}' added successfully`);
      setNewUsername('');
      setNewAdminPassword('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add admin');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (username: string) => {
    if (!confirm(`Are you sure you want to remove admin '${username}'?`)) return;

    clearMessages();
    try {
      authService.removeAdmin(username);
      setSuccess(`Admin '${username}' removed successfully`);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin');
    }
  };

  const handleClearAllData = () => {
    if (!confirm('⚠️ This will delete ALL ballot data and reset the system. This cannot be undone. Are you sure?')) return;
    if (!confirm('This includes all participants, groups, results, and admin accounts except the default admin. Continue?')) return;

    try {
      authService.clearAllData();
      setSuccess('All data cleared successfully. Please refresh the page.');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data');
    }
  };

  const handleClearBallotData = async () => {
    if (!confirm('⚠️ This will delete ALL ballot data (participants, groups, results) but keep admin accounts. Continue?')) return;
    if (!confirm('This includes all participants, groups, ballot results, and sessions. Admin accounts will be preserved. Are you sure?')) return;

    try {
      await clearBallotData();
      setSuccess('Ballot data cleared successfully. Admin accounts preserved.');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear ballot data');
    }
  };

  if (!authService.isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You must be logged in to access admin settings.</p>
          <button onClick={() => onNavigate('admin-login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your admin account and system settings
            </p>
          </div>
          <button
            onClick={() => onNavigate('admin-dashboard')}
            className="btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-error-50 border border-error-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-error-700">⚠️ {error}</span>
              <button onClick={clearMessages} className="text-error-600 hover:text-error-800">×</button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-success-700">✅ {success}</span>
              <button onClick={clearMessages} className="text-success-600 hover:text-success-800">×</button>
            </div>
          </div>
        )}

        {/* Admin Stats */}
        {adminStats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Session</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Logged in as</div>
                <div className="font-semibold text-gray-900">{adminStats.currentAdmin}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Login time</div>
                <div className="font-semibold text-gray-900">
                  {adminStats.loginTime ? new Date(adminStats.loginTime).toLocaleTimeString() : 'Unknown'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total admins</div>
                <div className="font-semibold text-gray-900">{adminStats.totalAdmins}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Session status</div>
                <div className={`font-semibold ${adminStats.sessionValid ? 'text-success-600' : 'text-error-600'}`}>
                  {adminStats.sessionValid ? 'Valid' : 'Expired'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'password', name: 'Change Password', icon: '🔒' },
              { id: 'admins', name: 'Manage Admins', icon: '👥' },
              { id: 'system', name: 'System', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'password' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-field"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    required
                    minLength={6}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                  className="btn-primary"
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="space-y-6">
              {/* Add New Admin */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Add New Admin</h3>
                
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        id="newUsername"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="input-field"
                        required
                        minLength={3}
                        disabled={loading}
                        autoComplete="off"
                      />
                    </div>

                    <div>
                      <label htmlFor="newAdminPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        id="newAdminPassword"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="input-field"
                        required
                        minLength={6}
                        disabled={loading}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !newUsername.trim() || !newAdminPassword}
                    className="btn-primary"
                  >
                    {loading ? 'Adding Admin...' : 'Add Admin'}
                  </button>
                </form>
              </div>

              {/* Existing Admins */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Existing Admins</h3>
                
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {admins.map((admin) => (
                        <tr key={admin.username}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">{admin.username}</span>
                              {admin.username === adminStats?.currentAdmin && (
                                <span className="ml-2 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
                                  Current
                                </span>
                              )}
                              {admin.username === 'admin' && (
                                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {admin.username !== adminStats?.currentAdmin && admin.username !== 'admin' && (
                              <button
                                onClick={() => handleRemoveAdmin(admin.username)}
                                className="text-error-600 hover:text-error-900"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">System Management</h3>
              
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Danger Zone</h4>
                  <p className="text-yellow-700 text-sm mb-4">
                    These actions cannot be undone. Please use with caution.
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleClearBallotData}
                      className="bg-warning-600 text-white px-4 py-2 rounded-md font-medium hover:bg-warning-700 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 mr-3"
                    >
                      🧹 Clear Ballot Data Only
                    </button>
                    <button
                      onClick={handleClearAllData}
                      className="bg-error-600 text-white px-4 py-2 rounded-md font-medium hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
                    >
                      🗑️ Clear All Data
                    </button>
                  </div>
                  
                  <div className="text-xs text-yellow-600 mt-3 space-y-1">
                    <div><strong>Clear Ballot Data Only:</strong> Removes all participants, groups, ballot results, and sessions. Keeps admin accounts.</div>
                    <div><strong>Clear All Data:</strong> Removes everything including admin accounts (except default admin).</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">💾 Data Storage</h4>
                  <p className="text-blue-700 text-sm">
                    All data is stored locally in your browser's localStorage. 
                    No data is sent to external servers. To backup your data, 
                    use the export features in the admin dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}