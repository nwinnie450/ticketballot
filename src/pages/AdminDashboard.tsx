import React, { useState } from 'react';
import { useBallot } from '../hooks/useBallot';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
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
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'groups' | 'ballot'>('overview');

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipantEmail.trim()) return;

    try {
      await registerParticipant(newParticipantEmail.trim(), 'admin');
      setNewParticipantEmail('');
    } catch (err) {
      // Error handled by context
    }
  };

  const handleStartBallot = async () => {
    if (!confirm('Start the ballot session? Representatives will then be able to draw their positions.')) return;
    
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage participants, groups, and ballot process</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {!ballotResults && approvedGroups.length > 0 && (
                <button
                  onClick={handleStartBallot}
                  disabled={loading}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  🚀 Start Ballot Session
                </button>
              )}
              <button
                onClick={() => onNavigate('results')}
                className="btn-secondary"
                disabled={!ballotResults}
              >
                View Results
              </button>
            </div>
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
            <div className="text-gray-600 mt-1">Total Participants</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-warning-600">{stats.pendingGroups}</div>
            <div className="text-gray-600 mt-1">Pending Groups</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-success-600">{stats.approvedGroups}</div>
            <div className="text-gray-600 mt-1">Approved Groups</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.lockedGroups}</div>
            <div className="text-gray-600 mt-1">Locked Groups</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          {/* Desktop Tabs */}
          <nav className="hidden md:flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'participants', name: 'Participants', icon: '👥' },
              { id: 'groups', name: 'Groups', icon: '🏷️' },
              { id: 'ballot', name: 'Ballot', icon: '🎯' },
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
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'participants', name: 'Participants', icon: '👥' },
              { id: 'groups', name: 'Groups', icon: '🏷️' },
              { id: 'ballot', name: 'Ballot', icon: '🎯' },
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {groups.slice(-5).reverse().map((group) => (
                    <div key={group.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Group created ({group.members.length} members)
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
                        {group.status}
                      </span>
                    </div>
                  ))}
                  {groups.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No activity yet</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                
                <form onSubmit={handleAddParticipant} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Add Participant by Email
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="email"
                        value={newParticipantEmail}
                        onChange={(e) => setNewParticipantEmail(e.target.value)}
                        className="flex-1 input-field"
                        placeholder="participant@email.com"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loading || !newParticipantEmail.trim()}
                        className="btn-primary"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </form>

                <div className="mt-6 space-y-2">
                  {pendingGroups.length > 0 && (
                    <div className="text-sm text-warning-600">
                      ⚠️ {pendingGroups.length} groups waiting for approval
                    </div>
                  )}
                  {ballotResults && (
                    <div className="text-sm text-success-600">
                      ✅ Ballot completed with {ballotResults.totalGroups} groups
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Participants ({participants.length})</h3>
                <form onSubmit={handleAddParticipant} className="flex gap-2">
                  <input
                    type="email"
                    value={newParticipantEmail}
                    onChange={(e) => setNewParticipantEmail(e.target.value)}
                    className="input-field"
                    placeholder="Add participant..."
                    required
                  />
                  <button type="submit" disabled={loading} className="btn-primary">
                    Add
                  </button>
                </form>
              </div>

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
                        Added By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Group Status
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              participant.addedBy === 'admin' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {participant.addedBy}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(participant.registeredAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {inGroup ? (
                              <span className="text-success-600">In Group</span>
                            ) : (
                              <span className="text-gray-500">No Group</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {participant.role === 'user' ? (
                                <button
                                  onClick={() => designateRepresentative(participant.email)}
                                  disabled={loading}
                                  className="text-purple-600 hover:text-purple-800"
                                  title="Make Representative"
                                >
                                  👑 Rep
                                </button>
                              ) : (
                                <button
                                  onClick={() => removeRepresentativeRole(participant.email)}
                                  disabled={loading}
                                  className="text-gray-600 hover:text-gray-800"
                                  title="Remove Representative Role"
                                >
                                  👤 User
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm(`Remove ${participant.email}?`)) {
                                    removeParticipant(participant.email);
                                  }
                                }}
                                disabled={loading}
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
          )}

          {activeTab === 'groups' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Groups ({groups.length})</h3>

              <div className="space-y-4">
                {groups.map((group) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">
                            Group ({group.members.length} members)
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
                              disabled={loading}
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
                              disabled={loading}
                              className="text-error-600 hover:text-error-800 text-sm font-medium"
                            >
                              ❌ Remove
                            </button>
                          </>
                        )}
                        
                        {group.status === 'approved' && ballotStatus === 'not-started' && (
                          <span className="text-success-600 text-sm">Ready for ballot</span>
                        )}
                        
                        {group.status === 'ballot-ready' && (
                          <span className="text-warning-600 text-sm">Waiting for rep to draw</span>
                        )}
                        
                        {group.status === 'ballot-drawn' && (
                          <span className="text-blue-600 text-sm">Position #{group.ballotPosition} drawn</span>
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
          )}

          {activeTab === 'ballot' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Ballot Management</h3>
                {ballotStatus === 'not-started' && approvedGroups.length > 0 && (
                  <button
                    onClick={handleStartBallot}
                    disabled={loading}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                  >
                    🚀 Start Ballot Session
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
                        <h4 className="font-semibold text-gray-800">Ballot Not Started</h4>
                        <p className="text-gray-600 text-sm">Click "Start Ballot Session" to begin the drawing process.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {ballotStatus === 'in-progress' && (
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-warning-600 text-2xl">⏳</span>
                      <div>
                        <h4 className="font-semibold text-warning-800">Ballot in Progress</h4>
                        <p className="text-warning-700 text-sm">
                          Representatives are drawing positions. {ballotDrawnGroups.length} of {ballotReadyGroups.length + ballotDrawnGroups.length} groups have completed their draws.
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
                        <h4 className="font-semibold text-success-800">Ballot Completed</h4>
                        <p className="text-success-700 text-sm">
                          All groups have drawn their positions. Results are now available.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {ballotResults && ballotStatus === 'completed' ? (
                <div className="space-y-4">
                  <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                    <h4 className="font-semibold text-success-800 mb-2">✅ Ballot Completed</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-success-600">Drawn:</span>
                        <div className="font-medium">{new Date(ballotResults.drawnAt).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-success-600">Groups:</span>
                        <div className="font-medium">{ballotResults.totalGroups}</div>
                      </div>
                      <div>
                        <span className="text-success-600">Participants:</span>
                        <div className="font-medium">{ballotResults.totalParticipants}</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Participant List Ordered by Position */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-4">🎯 Final Allocation Order</h4>
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
                                    {group.name || `Group ${String.fromCharCode(64 + entry.position)}`}
                                  </h5>
                                  <p className="text-xs text-gray-500">
                                    {group.members.length + 1} participants
                                  </p>
                                </div>
                              </div>
                              
                              <div className="ml-11 space-y-1">
                                {/* Representative first */}
                                <div className="flex items-center text-sm">
                                  <span className="inline-block w-16 text-xs text-purple-600 font-medium">Rep:</span>
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
                      View Public Results
                    </button>
                    <button
                      onClick={() => {
                        const csvContent = ballotResults.entries
                          .sort((a, b) => a.position - b.position)
                          .map(entry => {
                            const group = groups.find(g => g.id === entry.groupId);
                            const groupName = group?.name || `Group ${String.fromCharCode(64 + entry.position)}`;
                            return `${entry.position},"${groupName}","${group?.representative}","${group?.members.join('; ')}",${(group?.members.length || 0) + 1}`;
                          }).join('\n');
                        
                        const blob = new Blob([`Position,Group Name,Representative,Members,Total Size\n${csvContent}`], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ballot-results-detailed-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }}
                      className="btn-secondary"
                    >
                      📥 Export Detailed Results
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  {approvedGroups.length === 0 ? (
                    <div>
                      <div className="text-4xl mb-4">⏳</div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Approved Groups</h4>
                      <p className="text-gray-600">
                        You need approved groups before running the ballot.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-4">🎲</div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Draw</h4>
                      <p className="text-gray-600 mb-4">
                        {approvedGroups.length} approved groups ready for ballot draw.
                      </p>
                      <button
                        onClick={handleStartBallot}
                        disabled={loading}
                        className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                      >
                        🚀 Start Ballot Session
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