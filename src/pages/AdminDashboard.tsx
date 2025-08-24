import React, { useState } from 'react';
import { useBallot } from '../hooks/useBallot';
import { useLanguage } from '../contexts/LanguageContext';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { t } = useLanguage();
  const { 
    participants, 
    groups, 
    stats, 
    ballotResults,
    registerParticipant, 
    updateGroupStatus,
    removeParticipant,
    removeGroup,
    startBallot,
    getBallotStatus,
    designateRepresentative,
    removeRepresentativeRole,
    loading,
    error,
    clearError 
  } = useBallot();

  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [newParticipantWechatId, setNewParticipantWechatId] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'groups' | 'ballot'>('overview');

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipantEmail.trim() || !newParticipantWechatId.trim()) return;

    try {
      await registerParticipant(newParticipantEmail.trim(), newParticipantWechatId.trim(), 'admin');
      setNewParticipantEmail('');
      setNewParticipantWechatId('');
    } catch (err) {
      // Error handled by context
    }
  };

  const handleStartBallot = async () => {
    try {
      await startBallot();
      setActiveTab('ballot');
    } catch (err) {
      // Error handled by context
    }
  };

  const ballotStatus = getBallotStatus();
  const approvedGroups = groups.filter(g => g.status === 'approved');
  const ballotReadyGroups = groups.filter(g => g.status === 'ballot-ready');
  const ballotDrawnGroups = groups.filter(g => g.status === 'ballot-drawn');

  const pendingGroups = groups.filter(g => g.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-4 md:py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('adminDashboard.title')}</h1>
            <p className="text-gray-600 mt-1">{t('adminDashboard.welcome')}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {!ballotResults && approvedGroups.length > 0 && (
              <button
                onClick={handleStartBallot}
                disabled={loading}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                🚀 {t('adminDashboard.startBallot')}
              </button>
            )}
            <button
              onClick={() => onNavigate('results')}
              className="btn-secondary"
              disabled={!ballotResults}
            >
              {t('adminDashboard.viewResults')}
            </button>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-error-50 border border-error-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-error-700">⚠️ {error}</span>
                <button onClick={clearError} className="text-error-600 hover:text-error-800">×</button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600">{stats.totalParticipants}</div>
            <div className="text-gray-600 mt-1">{t('adminDashboard.totalParticipants')}</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-warning-600">{stats.pendingGroups}</div>
            <div className="text-gray-600 mt-1">{t('adminDashboard.pendingGroups')}</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-success-600">{stats.approvedGroups}</div>
            <div className="text-gray-600 mt-1">{t('adminDashboard.approvedGroups')}</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.lockedGroups}</div>
            <div className="text-gray-600 mt-1">{t('adminDashboard.lockedGroups')}</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          {/* Desktop Tabs */}
          <nav className="hidden md:flex space-x-8 px-6" aria-label={t('adminDashboard.tabs')}>
            {[
              { id: 'overview', name: t('adminDashboard.overview'), icon: '📊' },
              { id: 'participants', name: t('adminDashboard.participants'), icon: '👥' },
              { id: 'groups', name: t('adminDashboard.groups'), icon: '🏷️' },
              { id: 'ballot', name: t('adminDashboard.ballot'), icon: '🎯' },
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
          <nav className="md:hidden grid grid-cols-2 gap-1 p-3" aria-label={t('adminDashboard.mobileTabs')}>
            {[
              { id: 'overview', name: t('adminDashboard.overview'), icon: '📊' },
              { id: 'participants', name: t('adminDashboard.participants'), icon: '👥' },
              { id: 'groups', name: t('adminDashboard.groups'), icon: '🏷️' },
              { id: 'ballot', name: t('adminDashboard.ballot'), icon: '🎯' },
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
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('adminDashboard.recentActivity')}</h3>
                <div className="space-y-3">
                  {groups.slice(-5).reverse().map((group) => (
                    <div key={group.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {t('adminDashboard.groupCreated', { count: group.members.length })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(group.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        group.status === 'approved' 
                          ? 'bg-success-100 text-success-700'
                          : group.status === 'locked'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-warning-100 text-warning-700'
                      }`}>
                        {t(`adminDashboard.${group.status}`)}
                      </span>
                    </div>
                  ))}
                  {groups.length === 0 && (
                    <p className="text-gray-500 text-center py-4">{t('adminDashboard.noActivityYet')}</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('adminDashboard.quickActions')}</h3>
                
                <form onSubmit={handleAddParticipant} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('adminDashboard.addParticipant')}
                    </label>
                    <div className="mt-1 space-y-2">
                      <input
                        type="email"
                        value={newParticipantEmail}
                        onChange={(e) => setNewParticipantEmail(e.target.value)}
                        className="w-full input-field"
                        placeholder={t('adminDashboard.email')}
                        required
                      />
                      <input
                        type="text"
                        value={newParticipantWechatId}
                        onChange={(e) => setNewParticipantWechatId(e.target.value)}
                        className="w-full input-field"
                        placeholder={t('adminDashboard.wechatId')}
                        required
                      />
                      <button
                        type="submit"
                        disabled={loading || !newParticipantEmail.trim() || !newParticipantWechatId.trim()}
                        className="btn-primary"
                      >
                        {t('adminDashboard.add')}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="mt-6 space-y-2">
                  {pendingGroups.length > 0 && (
                    <div className="text-sm text-warning-600">
                      ⚠️ {t('adminDashboard.groupsWaitingApproval', { count: pendingGroups.length })}
                    </div>
                  )}
                  {ballotResults && (
                    <div className="text-sm text-success-600">
                      {t('adminDashboard.ballotCompleted', { count: ballotResults.totalGroups })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="card">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('adminDashboard.participantsHeader', { count: participants.length || 0 })}</h3>
              </div>
              
              <div className="mb-6">
                <form onSubmit={handleAddParticipant} className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('adminDashboard.emailAddress')}
                      </label>
                      <input
                        type="email"
                        value={newParticipantEmail}
                        onChange={(e) => setNewParticipantEmail(e.target.value)}
                        className="w-full input-field"
                        placeholder={t('adminDashboard.email')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('adminDashboard.wechatIdLabel')}
                      </label>
                      <input
                        type="text"
                        value={newParticipantWechatId}
                        onChange={(e) => setNewParticipantWechatId(e.target.value)}
                        className="w-full input-field"
                        placeholder={t('adminDashboard.wechatIdPlaceholder')}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <button type="submit" disabled={loading} className="btn-primary">
                      {t('adminDashboard.addParticipant')}
                    </button>
                  </div>
                </form>
              </div>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminDashboard.email')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminDashboard.wechatId')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminDashboard.role')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminDashboard.addedBy')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminDashboard.date')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminDashboard.groupStatus')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('adminDashboard.actions')}
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
                              {participant.role === 'representative' ? t('adminDashboard.roleRepresentative') : t('adminDashboard.roleUser')}
                            </span>
                            {participant.role === 'representative' && participant.designatedBy && (
                              <div className="text-xs text-gray-500 mt-1">
                                {t('adminSettings.by')} {participant.designatedBy === 'admin' ? t('adminDashboard.addedByAdmin') : t('adminDashboard.addedBySelf')}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              participant.addedBy === 'admin' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {participant.addedBy === 'admin' ? t('adminDashboard.addedByAdmin') : t('adminDashboard.addedBySelf')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(participant.registeredAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {inGroup ? (
                              <span className="text-success-600">{t('adminDashboard.statusInGroup')}</span>
                            ) : (
                              <span className="text-gray-500">{t('adminDashboard.statusNoGroup')}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {participant.role === 'user' ? (
                                <button
                                  onClick={() => designateRepresentative(participant.email)}
                                  disabled={loading}
                                  className="text-purple-600 hover:text-purple-800"
                                  title={t('adminDashboard.makeRepresentative')}
                                >
                                  👑 {t('adminDashboard.repRole')}
                                </button>
                              ) : (
                                <button
                                  onClick={() => removeRepresentativeRole(participant.email)}
                                  disabled={loading}
                                  className="text-gray-600 hover:text-gray-800"
                                  title={t('adminDashboard.removeRepresentativeRole')}
                                >
                                  👤 {t('adminDashboard.userRole')}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm(t('adminDashboard.confirmRemoveParticipant', { email: participant.email }))) {
                                    removeParticipant(participant.email);
                                  }
                                }}
                                disabled={loading}
                                className="text-error-600 hover:text-error-900"
                              >
                                {t('adminDashboard.remove')}
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
                    {t('adminDashboard.noParticipantsYet')}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('adminDashboard.groups')} ({groups.length || 0})</h3>

              <div className="space-y-4">
                {groups.map((group) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">
                            {t('adminDashboard.groupMembers', { count: group.members.length })}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            group.status === 'approved' 
                              ? 'bg-success-100 text-success-700'
                              : group.status === 'locked'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-warning-100 text-warning-700'
                          }`}>
                            {t(`adminDashboard.${group.status}`)}
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
                              disabled={loading}
                              className="text-success-600 hover:text-success-800 text-sm font-medium"
                            >
                              ✅ {t('adminDashboard.approve')}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Remove this group?')) {
                                  removeGroup(group.id);
                                }
                              }}
                              disabled={loading}
                              className="text-error-600 hover:text-error-800 text-sm font-medium"
                            >
                              ❌ {t('adminDashboard.remove')}
                            </button>
                          </>
                        )}
                        
                        {group.status === 'approved' && ballotStatus === 'not-started' && (
                          <span className="text-success-600 text-sm">{t('adminDashboard.readyForBallot')}</span>
                        )}
                        
                        {group.status === 'ballot-ready' && (
                          <span className="text-warning-600 text-sm">{t('adminDashboard.waitingForDraw')}</span>
                        )}
                        
                        {group.status === 'ballot-drawn' && (
                          <span className="text-blue-600 text-sm">{t('adminDashboard.positionDrawn', { position: group.ballotPosition || 0 })}</span>
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
                    {t('adminDashboard.noGroupsYet')}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ballot' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{t('adminDashboard.ballotManagement')}</h3>
                {ballotStatus === 'not-started' && approvedGroups.length > 0 && (
                  <button
                    onClick={handleStartBallot}
                    disabled={loading}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                  >
                    🚀 {t('adminDashboard.startBallotSession')}
                  </button>
                )}
              </div>

              {/* Ballot Status Overview */}
              <div className="mb-6">
                {ballotStatus === 'not-started' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600 text-2xl">⏸️</span>
                      <div>
                        <h4 className="font-semibold text-gray-800">{t('adminDashboard.ballotNotStarted')}</h4>
                        <p className="text-gray-600 text-sm">{t('adminDashboard.ballotNotStartedDesc')}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {ballotStatus === 'in-progress' && (
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-warning-600 text-2xl">⏳</span>
                      <div>
                        <h4 className="font-semibold text-warning-800">{t('adminDashboard.ballotInProgress')}</h4>
                        <p className="text-warning-700 text-sm">
                          {t('adminDashboard.ballotInProgressDesc', { 
                            drawn: ballotDrawnGroups.length, 
                            total: ballotReadyGroups.length + ballotDrawnGroups.length 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {ballotStatus === 'completed' && (
                  <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-success-600 text-2xl">✅</span>
                      <div>
                        <h4 className="font-semibold text-success-800">{t('adminDashboard.ballotCompleted', { count: ballotResults?.totalGroups || 0 })}</h4>
                        <p className="text-success-700 text-sm">
                          {t('adminDashboard.ballotCompletedDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {ballotResults && ballotStatus === 'completed' ? (
                <div className="space-y-4">
                  <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                    <h4 className="font-semibold text-success-800 mb-2">{t('adminDashboard.ballotCompleted', { count: ballotResults?.totalGroups || 0 })}</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-success-600">{t('status.drawnOn')}:</span>
                        <div className="font-medium">{new Date(ballotResults.drawnAt).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-success-600">{t('status.totalGroups')}:</span>
                        <div className="font-medium">{ballotResults.totalGroups}</div>
                      </div>
                      <div>
                        <span className="text-success-600">{t('status.totalParticipants')}:</span>
                        <div className="font-medium">{ballotResults.totalParticipants}</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Participant List Ordered by Position */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-4">🎯 {t('adminDashboard.finalAllocationOrder')}</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {ballotResults.entries
                        .sort((a, b) => a.position - b.position)
                        .map((entry) => {
                          const group = groups.find(g => g.id === entry.groupId);
                          if (!group) return null;
                          
                          return (
                            <div key={entry.groupId} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center mb-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm mr-3">
                                  #{entry.position}
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-900">
                                    {group.name || t('adminDashboard.groupNameFallback', { letter: String.fromCharCode(64 + entry.position) })}
                                  </h5>
                                  <p className="text-xs text-gray-500">
                                    {group.members.length + 1} {t('adminDashboard.participants')}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="ml-11 space-y-1">
                                {/* Representative first */}
                                <div className="flex items-center text-sm">
                                  <span className="inline-block w-16 text-xs text-purple-600 font-medium">{t('adminDashboard.representativeLabel')}</span>
                                  <span className="text-gray-900">{group.representative}</span>
                                </div>
                                
                                {/* Members */}
                                {group.members.map((member, idx) => (
                                  <div key={idx} className="flex items-center text-sm">
                                    <span className="inline-block w-16 text-xs text-gray-500"></span>
                                    <span className="text-gray-700">{member}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => onNavigate('results')} className="btn-primary">
                      {t('adminDashboard.viewPublicResults')}
                    </button>
                    <button
                      onClick={() => {
                        const csvContent = ballotResults.entries
                          .sort((a, b) => a.position - b.position)
                          .map(entry => {
                            const group = groups.find(g => g.id === entry.groupId);
                            const groupName = group?.name || t('adminDashboard.groupNameFallback', { letter: String.fromCharCode(64 + entry.position) });
                            return `${entry.position},"${groupName}","${group?.representative}","${group?.members.join('; ')}",${(group?.members.length || 0) + 1}`;
                          }).join('\n');
                        
                        const blob = new Blob([`${t('adminDashboard.csvHeaders')}\n${csvContent}`], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ballot-results-detailed-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }}
                      className="btn-secondary"
                    >
                      📥 {t('adminDashboard.exportDetailedResults')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  {approvedGroups.length === 0 ? (
                    <div>
                      <div className="text-4xl mb-4">⏳</div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">{t('adminDashboard.noApprovedGroups')}</h4>
                      <p className="text-gray-600">
                        {t('adminDashboard.noApprovedGroupsDesc')}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-4">🎲</div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">{t('adminDashboard.readyToDraw')}</h4>
                      <p className="text-gray-600 mb-4">
                        {t('adminDashboard.readyToDrawDesc', { count: approvedGroups.length })}
                      </p>
                      <button
                        onClick={handleStartBallot}
                        disabled={loading}
                        className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                      >
                        🚀 {t('adminDashboard.startBallotSession')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}