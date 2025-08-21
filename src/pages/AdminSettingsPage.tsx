import { useState, useEffect } from 'react';
import { useBallot } from '../hooks/useBallot';
import { authService } from '../services/authService';

interface AdminSettingsPageProps {
  onNavigate: (page: string) => void;
}

export function AdminSettingsPage({ onNavigate }: AdminSettingsPageProps) {
  const { 
    clearBallotData, 
    participants, 
    groups, 
    registerParticipant,
    removeParticipant,
    designateRepresentative,
    removeRepresentativeRole,
    createGroup,
    updateGroupStatus,
    removeGroup,
    loading: ballotLoading,
    error: ballotError,
    clearError: clearBallotError
  } = useBallot();
  const [activeTab, setActiveTab] = useState<'password' | 'admins' | 'users' | 'system'>('password');
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

  // User management form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [assignToGroup, setAssignToGroup] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [makeRepresentative, setMakeRepresentative] = useState(false);
  const [groupName, setGroupName] = useState('');
  
  // Group creation form (separate from adding users)
  const [selectedUsersForGroup, setSelectedUsersForGroup] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedRepresentative, setSelectedRepresentative] = useState('');

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

  // User management handlers
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      // First register the participant
      await registerParticipant(newUserEmail, 'admin');
      
      // If they should be a representative, designate them
      if (makeRepresentative) {
        await designateRepresentative(newUserEmail);
      }
      
      // If assigning to group, create the group
      if (assignToGroup && selectedGroupMembers.length > 0) {
        // The new user becomes the representative if makeRepresentative is true
        // Otherwise, find a representative from selected members
        const representative = makeRepresentative ? newUserEmail : selectedGroupMembers[0];
        
        // If the representative is not the new user, they must already be a representative
        if (representative !== newUserEmail) {
          const repParticipant = participants.find(p => p.email === representative);
          if (!repParticipant || repParticipant.role !== 'representative') {
            throw new Error(`${representative} must be a representative to create groups`);
          }
        }
        
        // Create group with selected members (excluding the representative)
        const groupMembers = selectedGroupMembers.filter(email => email !== representative);
        await createGroup(representative, groupMembers, groupName || undefined);
        setSuccess(`User '${newUserEmail}' added and assigned to group successfully`);
      } else {
        setSuccess(`User '${newUserEmail}' added successfully`);
      }
      
      // Reset form
      setNewUserEmail('');
      setAssignToGroup(false);
      setSelectedGroupMembers([]);
      setMakeRepresentative(false);
      setGroupName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleDesignateRep = async (email: string) => {
    try {
      await designateRepresentative(email);
      setSuccess(`${email} designated as representative`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to designate representative');
    }
  };

  const handleRemoveRepRole = async (email: string) => {
    try {
      await removeRepresentativeRole(email);
      setSuccess(`Representative role removed from ${email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove representative role');
    }
  };

  const handleRemoveUser = async (email: string) => {
    if (!confirm(`Remove user ${email}? This will also remove them from any groups.`)) return;
    
    try {
      await removeParticipant(email);
      setSuccess(`User ${email} removed successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
    }
  };

  const handleCreateGroupFromUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (selectedUsersForGroup.length < 1 || selectedUsersForGroup.length > 3) {
        throw new Error('Groups must have 1-3 members');
      }

      if (!selectedRepresentative) {
        throw new Error('Please select a representative for the group');
      }

      if (!selectedUsersForGroup.includes(selectedRepresentative)) {
        throw new Error('Representative must be a member of the group');
      }

      // Ensure the representative has the right role
      const repParticipant = participants.find(p => p.email === selectedRepresentative);
      if (!repParticipant || repParticipant.role !== 'representative') {
        throw new Error('Selected representative must have representative role');
      }

      // Create group with other members (excluding the representative)
      const groupMembers = selectedUsersForGroup.filter(email => email !== selectedRepresentative);
      await createGroup(selectedRepresentative, groupMembers, newGroupName || undefined);
      
      setSuccess(`Group "${newGroupName || 'Auto-generated'}" created successfully with ${selectedUsersForGroup.length} members`);
      
      // Reset form
      setSelectedUsersForGroup([]);
      setNewGroupName('');
      setSelectedRepresentative('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setLoading(false);
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
        {(error || ballotError) && (
          <div className="mb-6 bg-error-50 border border-error-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-error-700">⚠️ {error || ballotError}</span>
              <button onClick={() => {
                clearMessages();
                if (ballotError) clearBallotError();
              }} className="text-error-600 hover:text-error-800">×</button>
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
              { id: 'users', name: 'Manage Users', icon: '👤' },
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

          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Add New User */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Add New User</h3>
                
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="newUserEmail"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="input-field"
                      placeholder="user@example.com"
                      required
                      disabled={loading || ballotLoading}
                      autoComplete="off"
                    />
                  </div>

                  {/* Role Assignment */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={makeRepresentative}
                        onChange={(e) => setMakeRepresentative(e.target.checked)}
                        disabled={loading || ballotLoading}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Make Representative</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Representatives can create and manage groups</p>
                  </div>

                  {/* Group Assignment */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={assignToGroup}
                        onChange={(e) => setAssignToGroup(e.target.checked)}
                        disabled={loading || ballotLoading}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Assign to Group</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Create a group with this user and up to 2 other members</p>
                  </div>

                  {/* Group Configuration */}
                  {assignToGroup && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div>
                        <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
                          Group Name (Optional)
                        </label>
                        <input
                          type="text"
                          id="groupName"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          className="input-field"
                          placeholder="e.g., Alpha Squad (leave blank for auto-generated name)"
                          disabled={loading || ballotLoading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Group Members (Max 3 total including new user)
                        </label>
                        
                        {/* Available participants for selection */}
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                          {participants
                            .filter(p => !groups.some(g => 
                              g.representative === p.email || g.members.includes(p.email)
                            ))
                            .map(participant => (
                            <label key={participant.email} className="flex items-center p-2 hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={selectedGroupMembers.includes(participant.email)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    if (selectedGroupMembers.length < 2) { // Max 3 total including new user
                                      setSelectedGroupMembers([...selectedGroupMembers, participant.email]);
                                    }
                                  } else {
                                    setSelectedGroupMembers(selectedGroupMembers.filter(email => email !== participant.email));
                                  }
                                }}
                                disabled={
                                  loading || ballotLoading || 
                                  (!selectedGroupMembers.includes(participant.email) && selectedGroupMembers.length >= 2)
                                }
                                className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm text-gray-900">{participant.email}</span>
                                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                  participant.role === 'representative' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {participant.role}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                        
                        {participants.filter(p => !groups.some(g => 
                          g.representative === p.email || g.members.includes(p.email)
                        )).length === 0 && (
                          <p className="text-sm text-gray-500 py-2">No available participants to add to group</p>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2">
                          Selected: {selectedGroupMembers.length + 1}/3 members (including new user)
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      loading || ballotLoading || !newUserEmail.trim() ||
                      (assignToGroup && !makeRepresentative && selectedGroupMembers.length === 0)
                    }
                    className="btn-primary w-full"
                  >
                    {loading || ballotLoading ? 'Adding...' : 'Add User'}
                  </button>
                </form>
              </div>

              {/* Create Groups from Existing Users */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Create Group from Existing Users</h3>
                
                <form onSubmit={handleCreateGroupFromUsers} className="space-y-4">
                  <div>
                    <label htmlFor="newGroupName" className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="newGroupName"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="input-field"
                      placeholder="e.g., Alpha Squad (leave blank for auto-generated name)"
                      disabled={loading || ballotLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Users for Group (Max 3)
                    </label>
                    
                    {/* Available participants for group selection */}
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                      {participants
                        .filter(p => !groups.some(g => 
                          g.representative === p.email || g.members.includes(p.email)
                        ))
                        .map(participant => (
                        <label key={participant.email} className="flex items-center p-3 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedUsersForGroup.includes(participant.email)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (selectedUsersForGroup.length < 3) {
                                  setSelectedUsersForGroup([...selectedUsersForGroup, participant.email]);
                                  // Auto-select first representative if none selected
                                  if (!selectedRepresentative && participant.role === 'representative') {
                                    setSelectedRepresentative(participant.email);
                                  }
                                }
                              } else {
                                setSelectedUsersForGroup(selectedUsersForGroup.filter(email => email !== participant.email));
                                // Clear representative if they were deselected
                                if (selectedRepresentative === participant.email) {
                                  setSelectedRepresentative('');
                                }
                              }
                            }}
                            disabled={
                              loading || ballotLoading || 
                              (!selectedUsersForGroup.includes(participant.email) && selectedUsersForGroup.length >= 3)
                            }
                            className="mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-900 font-medium">{participant.email}</span>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  participant.role === 'representative' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {participant.role}
                                </span>
                                {participant.role === 'representative' && selectedUsersForGroup.includes(participant.email) && (
                                  <span className="text-xs text-purple-600">✓ Can lead group</span>
                                )}
                              </div>
                            </div>
                            {participant.role === 'representative' && participant.designatedBy && (
                              <div className="text-xs text-gray-500 mt-1">
                                Representative designated by {participant.designatedBy}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    {participants.filter(p => !groups.some(g => 
                      g.representative === p.email || g.members.includes(p.email)
                    )).length === 0 && (
                      <p className="text-sm text-gray-500 py-4 text-center">No available users to form groups</p>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">
                      Selected: {selectedUsersForGroup.length}/3 users
                    </p>
                  </div>

                  {/* Representative Selection */}
                  {selectedUsersForGroup.length > 0 && (
                    <div>
                      <label htmlFor="selectedRepresentative" className="block text-sm font-medium text-gray-700 mb-1">
                        Group Representative *
                      </label>
                      <select
                        id="selectedRepresentative"
                        value={selectedRepresentative}
                        onChange={(e) => setSelectedRepresentative(e.target.value)}
                        className="input-field"
                        required
                        disabled={loading || ballotLoading}
                      >
                        <option value="">Select representative...</option>
                        {selectedUsersForGroup
                          .filter(email => {
                            const participant = participants.find(p => p.email === email);
                            return participant?.role === 'representative';
                          })
                          .map(email => (
                            <option key={email} value={email}>
                              {email}
                            </option>
                          ))}
                      </select>
                      {selectedUsersForGroup.filter(email => {
                        const participant = participants.find(p => p.email === email);
                        return participant?.role === 'representative';
                      }).length === 0 && (
                        <p className="text-xs text-warning-600 mt-1">
                          ⚠️ No representatives selected. You need at least one representative to lead the group.
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      loading || ballotLoading || 
                      selectedUsersForGroup.length === 0 || 
                      selectedUsersForGroup.length > 3 ||
                      !selectedRepresentative
                    }
                    className="btn-primary w-full"
                  >
                    {loading || ballotLoading ? 'Creating Group...' : `Create Group (${selectedUsersForGroup.length} members)`}
                  </button>
                </form>
              </div>

              {/* User Management */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">User Management ({participants.length})</h3>
                
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Group Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Added
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {participants.map((participant, index) => {
                        const inGroup = groups.find(g => 
                          g.representative.toLowerCase() === participant.email.toLowerCase() ||
                          g.members.some(m => m.toLowerCase() === participant.email.toLowerCase())
                        );

                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {participant.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                participant.role === 'representative' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {participant.role}
                              </span>
                              {participant.role === 'representative' && participant.designatedBy && (
                                <div className="text-xs text-gray-500 mt-1">
                                  by {participant.designatedBy}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {inGroup ? (
                                <span className="text-success-600">In Group</span>
                              ) : (
                                <span className="text-gray-500">No Group</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(participant.registeredAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                {participant.role === 'user' ? (
                                  <button
                                    onClick={() => handleDesignateRep(participant.email)}
                                    disabled={loading || ballotLoading}
                                    className="text-purple-600 hover:text-purple-800"
                                    title="Make Representative"
                                  >
                                    👑 Rep
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRemoveRepRole(participant.email)}
                                    disabled={loading || ballotLoading}
                                    className="text-gray-600 hover:text-gray-800"
                                    title="Remove Representative Role"
                                  >
                                    👤 User
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveUser(participant.email)}
                                  disabled={loading || ballotLoading}
                                  className="text-error-600 hover:text-error-900"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {participants.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No participants yet
                    </div>
                  )}
                </div>
              </div>

              {/* Group Management */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Group Management ({groups.length})</h3>

                <div className="space-y-4">
                  {groups.map((group) => (
                    <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">
                              {group.name || 'Unnamed Group'} ({group.members.length} members)
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              group.status === 'approved' 
                                ? 'bg-success-100 text-success-700'
                                : group.status === 'locked'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-warning-100 text-warning-700'
                            }`}>
                              {group.status}
                            </span>
                          </div>
                          
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600">
                              <strong>Representative:</strong> {group.representative}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Members:</strong> {group.members.join(', ')}
                            </p>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(group.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {group.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateGroupStatus(group.id, 'approved')}
                                disabled={loading || ballotLoading}
                                className="text-success-600 hover:text-success-800 text-sm font-medium"
                              >
                                ✅ Approve
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Remove this group?')) {
                                    removeGroup(group.id);
                                  }
                                }}
                                disabled={loading || ballotLoading}
                                className="text-error-600 hover:text-error-800 text-sm font-medium"
                              >
                                ❌ Reject
                              </button>
                            </>
                          )}
                          
                          {group.status === 'approved' && (
                            <span className="text-success-600 text-sm">Ready for ballot</span>
                          )}
                          
                          {group.status === 'locked' && (
                            <span className="text-blue-600 text-sm">Ballot completed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {groups.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No groups created yet
                    </div>
                  )}
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