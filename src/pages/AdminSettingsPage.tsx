import { useState, useEffect } from 'react';
import { useBallot } from '../hooks/useBallot';
import { authService } from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';

interface AdminSettingsPageProps {
  onNavigate: (page: string) => void;
}

export function AdminSettingsPage({ onNavigate }: AdminSettingsPageProps) {
  const { t } = useLanguage();
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
    refresh,
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
  const [newUserWechatId, setNewUserWechatId] = useState('');
  
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
    if (!confirm(t('adminSettings.confirmRemoveAdmin', { username }))) return;

    clearMessages();
    try {
      authService.removeAdmin(username);
      setSuccess(t('adminSettings.adminRemoved', { username }));
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('adminSettings.failedToRemoveAdmin'));
    }
  };

  const handleClearAllData = () => {
    if (!confirm(t('adminSettings.confirmClearAll1'))) return;
    if (!confirm(t('adminSettings.confirmClearAll2'))) return;

    try {
      authService.clearAllData();
      setSuccess(t('adminSettings.allDataCleared'));
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('adminSettings.failedToClearData'));
    }
  };

  const handleClearBallotData = async () => {
    if (!confirm(t('adminSettings.confirmClearBallot1'))) return;
    if (!confirm(t('adminSettings.confirmClearBallot2'))) return;

    try {
      await clearBallotData();
      setSuccess(t('adminSettings.ballotDataCleared'));
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('adminSettings.failedToClearBallotData'));
    }
  };

  // User management handlers
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      await registerParticipant(newUserEmail, newUserWechatId, 'admin');
      setSuccess(`User '${newUserEmail}' added successfully`);
      
      // Reset form
      setNewUserEmail('');
      setNewUserWechatId('');
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
    if (!confirm(t('adminSettings.confirmRemoveUser', { email }))) return;
    
    try {
      await removeParticipant(email);
      setSuccess(t('adminSettings.userRemoved', { email }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('adminSettings.failedToRemoveUser'));
    }
  };


  const handleRemoveFromGroup = async (email: string) => {
    if (!confirm(t('adminSettings.confirmRemoveFromGroup', { email }))) return;
    
    try {
      const userGroup = groups.find(g => 
        g.representative.toLowerCase() === email.toLowerCase() ||
        g.members.some(m => m.toLowerCase() === email.toLowerCase())
      );
      
      if (!userGroup) {
        throw new Error('User is not in any group');
      }
      
      if (userGroup.representative.toLowerCase() === email.toLowerCase()) {
        // If removing representative, remove entire group
        await removeGroup(userGroup.id);
        setSuccess(`Representative ${email} removed from group. Group disbanded.`);
      } else {
        // Remove member from group
        const newMembers = userGroup.members.filter(m => m.toLowerCase() !== email.toLowerCase());
        
        // Remove old group and create new one without this member
        await removeGroup(userGroup.id);
        if (newMembers.length > 0) {
          await createGroup(userGroup.representative, newMembers, userGroup.name);
        }
        setSuccess(`${email} removed from group successfully`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from group');
    }
  };

  const handleCreateGroupFromUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      // Total group size includes the representative
      if (selectedUsersForGroup.length < 1 || selectedUsersForGroup.length > 3) {
        throw new Error('Groups must have 1-3 total members (you have selected ' + selectedUsersForGroup.length + ')');
      }

      if (!selectedRepresentative) {
        throw new Error('Please select a representative for the group');
      }

      if (!selectedUsersForGroup.includes(selectedRepresentative)) {
        throw new Error('Representative must be a member of the group');
      }

      // Ensure the representative has the right role - designate them if needed
      const repParticipant = participants.find(p => p.email === selectedRepresentative);
      if (!repParticipant) {
        throw new Error('Selected representative not found');
      }
      
      if (repParticipant.role !== 'representative') {
        // Automatically designate them as representative
        await designateRepresentative(selectedRepresentative);
      }

      // Create group with other members (excluding the representative)
      const groupMembers = selectedUsersForGroup.filter(email => email !== selectedRepresentative);
      await createGroup(selectedRepresentative, groupMembers, newGroupName.trim() || undefined);
      
      setSuccess(`Group "${newGroupName.trim() || 'with Kelly song name'}" created successfully with ${selectedUsersForGroup.length} members`);
      
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
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('adminSettings.title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('adminSettings.description')}
          </p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('adminSettings.currentSession')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">{t('adminSettings.loggedInAs')}</div>
                <div className="font-semibold text-gray-900">{adminStats.currentAdmin}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('adminSettings.loginTime')}</div>
                <div className="font-semibold text-gray-900">
                  {adminStats.loginTime ? new Date(adminStats.loginTime).toLocaleTimeString() : 'Unknown'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('adminSettings.totalAdmins')}</div>
                <div className="font-semibold text-gray-900">{adminStats.totalAdmins}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('adminSettings.sessionStatus')}</div>
                <div className={`font-semibold ${adminStats.sessionValid ? 'text-success-600' : 'text-error-600'}`}>
                  {adminStats.sessionValid ? t('adminSettings.valid') : t('adminSettings.expired')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                refresh();
                loadData();
                
                // Debug: Show localStorage data
                const storageData = localStorage.getItem('ticket-ballot-data');
                if (storageData) {
                  const data = JSON.parse(storageData);
                  console.log('Storage Debug:', {
                    participants: data.participants?.length || 0,
                    groups: data.groups?.length || 0,
                    currentSessionId: data.currentSessionId,
                    sessions: data.ballotSessions?.length || 0
                  });
                  setSuccess(`Refreshed! Storage: ${data.participants?.length || 0} participants, ${data.groups?.length || 0} groups`);
                } else {
                  setSuccess('Data refreshed successfully');
                }
                
                setTimeout(() => setSuccess(''), 3000);
              }}
              disabled={loading || ballotLoading}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <span>🔄</span>
              <span>{loading || ballotLoading ? t('common.loading') : t('adminSettings.refreshData')}</span>
            </button>
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className="btn-secondary"
            >
              ← {t('adminSettings.backToDashboard')}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          {/* Desktop Tabs */}
          <nav className="hidden md:flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'password', name: t('adminSettings.password'), icon: '🔒' },
              { id: 'admins', name: t('adminSettings.admins'), icon: '👥' },
              { id: 'users', name: t('adminSettings.users'), icon: '👤' },
              { id: 'system', name: t('adminSettings.system'), icon: '⚙️' },
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
          
          {/* Mobile Tabs - Grid Layout */}
          <nav className="md:hidden grid grid-cols-2 gap-1 p-3" aria-label="Mobile Tabs">
            {[
              { id: 'password', name: t('adminSettings.passwordShort'), icon: '🔒' },
              { id: 'admins', name: t('adminSettings.admins'), icon: '👥' },
              { id: 'users', name: t('adminSettings.users'), icon: '👤' },
              { id: 'system', name: t('adminSettings.system'), icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 rounded-lg font-medium text-sm flex flex-col items-center space-y-1 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-xs">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'password' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('adminSettings.changePassword')}</h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('adminSettings.currentPassword')}
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
                    {t('adminSettings.newPassword')}
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
                  <p className="text-xs text-gray-500 mt-1">{t('adminSettings.minimumCharacters')}</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('adminSettings.confirmNewPassword')}
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
                  {loading ? t('adminSettings.changingPassword') : t('adminSettings.changePassword')}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="space-y-6">
              {/* Add New Admin */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('adminSettings.addNewAdmin')}</h3>
                
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('adminSettings.username')}
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
                        {t('adminSettings.passwordShort')}
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
                    {loading ? t('adminSettings.addingAdmin') : t('adminSettings.addAdmin')}
                  </button>
                </form>
              </div>

              {/* Existing Admins */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('adminSettings.existingAdmins')}</h3>
                
                <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('adminSettings.username')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('adminSettings.created')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('adminSettings.lastLogin')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('adminSettings.actions')}
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
                                  {t('adminSettings.current')}
                                </span>
                              )}
                              {admin.username === 'admin' && (
                                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                                  {t('adminSettings.default')}
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
                                {t('common.remove')}
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
              {/* Add New Participant */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('adminSettings.addNewParticipant')}</h3>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">🎩</span>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">{t('adminSettings.simpleSystem')}</h4>
                      <p className="text-sm text-blue-700">
                        <strong>{t('adminSettings.superadminDesc')}</strong> <br/>
                        <strong>{t('adminSettings.participantsDesc')}</strong>
                      </p>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('adminSettings.emailAddress')}
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
                    <p className="text-xs text-gray-500 mt-1">
                      {t('adminSettings.participantDesc')}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="newUserWechatId" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('adminSettings.wechatId')}
                    </label>
                    <input
                      type="text"
                      id="newUserWechatId"
                      value={newUserWechatId}
                      onChange={(e) => setNewUserWechatId(e.target.value)}
                      className="input-field"
                      placeholder="Enter WeChat ID"
                      required
                      disabled={loading || ballotLoading}
                      autoComplete="off"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('adminSettings.wechatRequiredDesc')}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || ballotLoading || !newUserEmail.trim() || !newUserWechatId.trim()}
                    className="btn-primary w-full"
                  >
                    {loading || ballotLoading ? t('adminSettings.addingUser') : t('adminSettings.addUser')}
                  </button>
                </form>
              </div>

              {/* Create Groups from Existing Users */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('adminSettings.createGroupFromUsers')}</h3>
                
                <form onSubmit={handleCreateGroupFromUsers} className="space-y-4">
                  <div>
                    <label htmlFor="newGroupName" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('adminSettings.groupNameOptional')}
                    </label>
                    <input
                      type="text"
                      id="newGroupName"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="input-field"
                      placeholder={t('adminSettings.leaveBlankForKelly')}
                      disabled={loading || ballotLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('adminSettings.selectUsersForGroup')}
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
                                {selectedUsersForGroup.includes(participant.email) && (
                                  <span className="text-xs text-green-600 font-medium">
                                    ✓ {t('adminSettings.selected')} {t('adminSettings.users')}
                                  </span>
                                )}
                              </div>
                            </div>
                            {participant.role === 'representative' && participant.designatedBy && (
                              <div className="text-xs text-gray-500 mt-1">
                                {t('adminDashboard.representative')} {t('adminSettings.added')} {t('adminSettings.by')} {participant.designatedBy}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    {participants.filter(p => !groups.some(g => 
                      g.representative === p.email || g.members.includes(p.email)
                    )).length === 0 && (
                      <p className="text-sm text-gray-500 py-4 text-center">{t('adminSettings.noAvailableUsers')}</p>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {t('adminSettings.selected')} {selectedUsersForGroup.length}/3 {t('adminSettings.users')}
                    </p>
                  </div>

                  {/* Representative Selection */}
                  {selectedUsersForGroup.length > 0 && (
                    <div>
                      <label htmlFor="selectedRepresentative" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('adminDashboard.representative')} *
                      </label>
                      <select
                        id="selectedRepresentative"
                        value={selectedRepresentative}
                        onChange={(e) => setSelectedRepresentative(e.target.value)}
                        className="input-field"
                        required
                        disabled={loading || ballotLoading}
                      >
                        <option value="">{t('adminSettings.selectRepresentativeFromGroup')}</option>
                        {selectedUsersForGroup.map(email => {
                          const participant = participants.find(p => p.email === email);
                          return (
                            <option key={email} value={email}>
                              {email} {participant?.role === 'representative' ? '(already rep)' : '(will become rep)'}
                            </option>
                          );
                        })}
                      </select>
                      <p className="text-xs text-blue-600 mt-1">
                        💡 Selected user will be designated as group representative if not already one.
                      </p>
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
                    {loading || ballotLoading ? t('adminSettings.creatingGroup') : `${t('adminSettings.createGroup')} (${selectedUsersForGroup.length} ${t('adminSettings.members')})`}
                  </button>
                </form>
              </div>

              {/* User Management */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('adminSettings.userManagement')} ({participants.length})</h3>
                
                <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('adminSettings.emailAddress')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('adminSettings.wechatId')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('adminSettings.role')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('adminSettings.groupName')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('adminSettings.added')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('adminSettings.actions')}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {participant.wechatId || '-'}
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
                                  {t('adminSettings.by')} {participant.designatedBy}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {inGroup ? (
                                <div>
                                  <span className="font-medium text-gray-900">{inGroup.name || t('adminSettings.unnamedGroup')}</span>
                                  <div className="text-xs text-gray-500">
                                    {inGroup.representative.toLowerCase() === participant.email.toLowerCase() ? `(${t('adminDashboard.representative')})` : `(${t('adminDashboard.member')})`}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">{t('adminSettings.noGroup')}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(participant.registeredAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-1">
                                {participant.role === 'user' ? (
                                  <button
                                    onClick={() => handleDesignateRep(participant.email)}
                                    disabled={loading || ballotLoading}
                                    className="text-purple-600 hover:text-purple-800 text-xs"
                                    title="Make Representative"
                                  >
                                    👑
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRemoveRepRole(participant.email)}
                                    disabled={loading || ballotLoading}
                                    className="text-gray-600 hover:text-gray-800 text-xs"
                                    title="Remove Representative Role"
                                  >
                                    👤
                                  </button>
                                )}
                                {inGroup && (
                                  <button
                                    onClick={() => handleRemoveFromGroup(participant.email)}
                                    disabled={loading || ballotLoading}
                                    className="text-orange-600 hover:text-orange-800 text-xs"
                                    title="Remove from Group"
                                  >
                                    🚫
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveUser(participant.email)}
                                  disabled={loading || ballotLoading}
                                  className="text-error-600 hover:text-error-900 text-xs"
                                >
                                  ❌
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
                      {t('adminSettings.noParticipantsYet')}
                    </div>
                  )}
                </div>
              </div>

              {/* Group Management */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{t('adminSettings.groupManagement')} ({groups.length})</h3>
                  <div className="text-xs text-gray-500">
                    {t('adminSettings.debugGroupsInMemory')} {groups.length} | 
                    {t('adminSettings.debugParticipants')} {participants.length}
                  </div>
                </div>

                <div className="space-y-4">
                  {groups.map((group) => (
                    <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">
                              {group.name || t('adminSettings.unnamedGroup')} ({group.members.length} {t('adminSettings.members')})
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
                              <strong>{t('adminDashboard.representative')}:</strong> {group.representative}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>{t('adminDashboard.members')}:</strong> {group.members.join(', ')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {t('adminDashboard.createdAt')}: {new Date(group.createdAt).toLocaleString()}
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
                                ✅ {t('adminDashboard.approve')}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(t('adminSettings.confirmRemoveGroup'))) {
                                    removeGroup(group.id);
                                  }
                                }}
                                disabled={loading || ballotLoading}
                                className="text-error-600 hover:text-error-800 text-sm font-medium"
                              >
                                ❌ {t('adminDashboard.reject')}
                              </button>
                            </>
                          )}
                          
                          {group.status === 'approved' && (
                            <span className="text-success-600 text-sm">{t('adminDashboard.readyForBallot')}</span>
                          )}
                          
                          {group.status === 'locked' && (
                            <span className="text-blue-600 text-sm">{t('adminDashboard.ballotCompletedStatus')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {groups.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {t('adminSettings.noGroupsCreated')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('adminSettings.systemManagement')}</h3>
              
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ {t('adminSettings.dangerZone')}</h4>
                  <p className="text-yellow-700 text-sm mb-4">
                    {t('adminSettings.dangerWarning')}
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleClearBallotData}
                      className="bg-warning-600 text-white px-4 py-2 rounded-md font-medium hover:bg-warning-700 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 mr-3"
                    >
                      🧹 {t('adminSettings.clearBallotOnly')}
                    </button>
                    <button
                      onClick={handleClearAllData}
                      className="bg-error-600 text-white px-4 py-2 rounded-md font-medium hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
                    >
                      🗑️ {t('adminSettings.clearAllData')}
                    </button>
                  </div>
                  
                  <div className="text-xs text-yellow-600 mt-3 space-y-1">
                    <div><strong>{t('adminSettings.clearBallotOnly')}:</strong> {t('adminSettings.clearBallotDesc')}</div>
                    <div><strong>{t('adminSettings.clearAllData')}:</strong> {t('adminSettings.clearAllDesc')}</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">💾 {t('adminSettings.dataStorage')}</h4>
                  <p className="text-blue-700 text-sm">
                    {t('adminSettings.dataStorageDesc')}
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