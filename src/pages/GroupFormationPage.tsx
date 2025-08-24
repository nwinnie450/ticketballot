import React, { useState, useEffect } from 'react';
import { useBallot } from '../hooks/useBallot';
import { useLanguage } from '../contexts/LanguageContext';

interface GroupFormationPageProps {
  onNavigate: (page: string) => void;
}

export function GroupFormationPage({ onNavigate }: GroupFormationPageProps) {
  const { t } = useLanguage();
  const { 
    createGroup,
    joinGroup,
    currentUser, 
    groups, 
    userRole, 
    loading, 
    error, 
    clearError,
    ballotResults,
    availableParticipants,
    joinableGroups
  } = useBallot();
  
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user already has a group
  const existingGroup = groups.find(g => 
    g.representative.toLowerCase() === currentUser?.toLowerCase() ||
    g.members.some(m => m.toLowerCase() === currentUser?.toLowerCase())
  );

  // Redirect guests only - allow users, representatives, and admins
  useEffect(() => {
    if (userRole === 'guest') {
      onNavigate('landing');
    }
  }, [userRole, onNavigate]);

  const addMember = () => {
    if (!newMember.trim()) return;
    
    const email = newMember.trim().toLowerCase();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert(t('group.create.invalidEmail'));
      return;
    }

    // Check for duplicates
    if (members.includes(email) || email === currentUser?.toLowerCase()) {
      alert(t('group.create.duplicateEmail'));
      return;
    }

    if (members.length >= 2) {
      alert(t('group.create.maxMembers'));
      return;
    }

    setMembers([...members, email]);
    setNewMember('');
  };

  const removeMember = (email: string) => {
    setMembers(members.filter(m => m !== email));
  };

  const addParticipantFromDropdown = (email: string) => {
    if (!email || selectedParticipants.includes(email) || email === currentUser?.toLowerCase()) return;
    
    if (selectedParticipants.length >= 2) {
      alert(t('group.create.maxMembers'));
      return;
    }
    
    setSelectedParticipants([...selectedParticipants, email]);
  };

  const removeSelectedParticipant = (email: string) => {
    setSelectedParticipants(selectedParticipants.filter(p => p !== email));
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Group must include the representative + selected participants
    const allMembers = [currentUser, ...selectedParticipants, ...members];

    if (allMembers.length < 1 || allMembers.length > 3) {
      alert(t('group.create.memberCount'));
      return;
    }

    setIsSubmitting(true);
    try {
      await createGroup(currentUser, allMembers);
      // Auto-navigate to status page on success
      setTimeout(() => {
        onNavigate('status');
      }, 1500);
    } catch (err) {
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedGroupId) return;

    setIsSubmitting(true);
    try {
      await joinGroup(selectedGroupId, currentUser);
      // Auto-navigate to status page on success
      setTimeout(() => {
        onNavigate('status');
      }, 1500);
    } catch (err) {
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userRole === 'guest') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('group.accessRequired')}</h2>
          <p className="text-gray-600 mb-6">
            {t('group.registerFirst')}
          </p>
          <button onClick={() => onNavigate('landing')} className="btn-primary">
            {t('group.registerNow')}
          </button>
        </div>
      </div>
    );
  }


  if (ballotResults) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('group.ballotComplete')}</h2>
          <p className="text-gray-600 mb-6">
            {t('group.formationClosed')}
          </p>
          <button onClick={() => onNavigate('results')} className="btn-primary">
            {t('group.viewResults')}
          </button>
        </div>
      </div>
    );
  }

  if (existingGroup) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">👥</div>
              <h2 className="text-2xl font-bold text-gray-900">{t('group.existing.title')}</h2>
              <p className="text-gray-600 mt-2">
                {t('group.existing.description')}
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('group.existing.details')}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('group.existing.representative')}:</span>
                    <span className="font-medium">
                      {existingGroup.representative}
                      {existingGroup.representative.toLowerCase() === currentUser?.toLowerCase() && ` (${t('group.existing.you')})`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('group.existing.groupSize')}:</span>
                    <span className="font-medium">{existingGroup.members.length} {t('group.existing.members')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('group.existing.status')}:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      existingGroup.status === 'approved' 
                        ? 'bg-success-100 text-success-700'
                        : existingGroup.status === 'locked'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-warning-100 text-warning-700'
                    }`}>
                      {existingGroup.status === 'pending' && `⏳ ${t('group.existing.statusPending')}`}
                      {existingGroup.status === 'approved' && `✅ ${t('group.existing.statusApproved')}`}
                      {existingGroup.status === 'locked' && `🔒 ${t('group.existing.statusLocked')}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('group.existing.membersTitle')}</h3>
                <div className="space-y-2">
                  {existingGroup.members.map((member, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                      <span className="text-gray-900">{member}</span>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {member.toLowerCase() === existingGroup.representative.toLowerCase() && (
                          <span className="text-primary-600 font-medium">{t('group.existing.rep')}</span>
                        )}
                        {member.toLowerCase() === currentUser?.toLowerCase() && (
                          <span className="text-success-600 font-medium">{t('group.existing.you')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => onNavigate('status')} className="btn-primary">
                  {t('group.existing.viewFullStatus')}
                </button>
                <button onClick={() => onNavigate('landing')} className="btn-secondary">
                  {t('group.existing.backToHome')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">👥</div>
            <h1 className="text-3xl font-bold text-gray-900">
              {mode === 'create' ? t('group.create.title') : t('group.join.title')}
            </h1>
            <p className="text-gray-600 mt-2">
              {mode === 'create' 
                ? t('group.create.description')
                : t('group.join.description')
              }
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => {
                setMode('create');
                clearError();
                setSelectedParticipants([]);
                setSelectedGroupId('');
                setMembers([]);
                setNewMember('');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'create'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('group.create.tab')}
            </button>
            <button
              onClick={() => {
                setMode('join');
                clearError();
                setSelectedParticipants([]);
                setSelectedGroupId('');
                setMembers([]);
                setNewMember('');
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'join'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('group.join.tab')}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-error-600 font-semibold">⚠️ {t('group.error')}:</span>
                <div className="ml-2 flex-1">
                  <span className="text-error-700">{error}</span>
                </div>
                <button 
                  onClick={clearError}
                  className="ml-2 text-error-600 hover:text-error-800"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {mode === 'create' ? (
            <form onSubmit={handleCreateGroup} className="space-y-6">
              {/* Create Group Form */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('group.create.membersTitle')}</h3>
                
                <div className="space-y-3">
                  {/* Representative (current user) */}
                  <div className="flex items-center justify-between py-3 px-4 bg-primary-50 border border-primary-200 rounded-lg">
                    <span className="font-medium text-primary-900">
                      {currentUser} <span className="text-sm font-normal">({t('group.create.youRepresentative')})</span>
                    </span>
                    <span className="text-primary-600 text-sm font-medium">👑 {t('group.create.rep')}</span>
                  </div>

                  {/* Selected participants from dropdown */}
                  {selectedParticipants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-gray-900">{participant}</span>
                      <button
                        type="button"
                        onClick={() => removeSelectedParticipant(participant)}
                        className="text-error-600 hover:text-error-800 text-sm font-medium"
                      >
                        {t('group.create.remove')}
                      </button>
                    </div>
                  ))}

                  {/* Manually added members */}
                  {members.map((member, index) => (
                    <div key={`manual-${index}`} className="flex items-center justify-between py-3 px-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-gray-900">{member}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(member)}
                        className="text-error-600 hover:text-error-800 text-sm font-medium"
                      >
                        {t('group.create.remove')}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add from registered participants */}
                {availableParticipants.length > 0 && (selectedParticipants.length + members.length) < 2 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('group.create.addParticipants')}
                    </label>
                    <select
                      value=""
                      onChange={(e) => addParticipantFromDropdown(e.target.value)}
                      className="input-field"
                      disabled={loading || isSubmitting}
                    >
                      <option value="">{t('group.create.selectParticipant')}</option>
                      {availableParticipants
                        .filter(p => 
                          p.email.toLowerCase() !== currentUser?.toLowerCase() && 
                          !selectedParticipants.includes(p.email.toLowerCase()) &&
                          !members.includes(p.email.toLowerCase())
                        )
                        .map((participant) => (
                          <option key={participant.email} value={participant.email}>
                            {participant.email} (WeChat: {participant.wechatId})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Manual email input (legacy) */}
                {(selectedParticipants.length + members.length) < 2 && (
                  <div className="mt-4">
                    <label htmlFor="newMember" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('group.create.addByEmail')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        id="newMember"
                        value={newMember}
                        onChange={(e) => setNewMember(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
                        className="flex-1 input-field"
                        placeholder={t('group.create.memberPlaceholder')}
                        disabled={loading || isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={addMember}
                        disabled={!newMember.trim() || loading || isSubmitting}
                        className="btn-secondary whitespace-nowrap"
                      >
                        + {t('group.create.add')}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-3 text-sm text-gray-600">
                  <p>{t('group.create.groupSize')}: {selectedParticipants.length + members.length + 1}/3 {t('group.create.membersLower')}</p>
                  <p className="mt-1">⚠️ {t('group.create.registeredRequired')}</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="flex-1 btn-primary"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('group.create.submitting')}
                    </span>
                  ) : (
                    t('group.create.submit')
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('landing')}
                  className="btn-secondary"
                >
                  {t('group.create.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoinGroup} className="space-y-6">
              {/* Join Group Form */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('group.join.availableGroups')}</h3>
                
                {joinableGroups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-lg">{t('group.join.noGroups')}</p>
                    <p className="text-sm mt-2">{t('group.join.createInstead')}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {joinableGroups.map((group) => (
                        <div key={group.id} className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedGroupId === group.id 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`} onClick={() => setSelectedGroupId(group.id)}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {group.name || `Group ${group.id.slice(-6)}`}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {group.members.length}/3 members
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>👑 {t('group.groupRepresentative', { name: group.representative })}</p>
                            <p>📅 {t('group.groupCreated', { date: new Date(group.createdAt).toLocaleDateString() })}</p>
                            {group.members.length > 1 && (
                              <p>👥 {t('group.groupMembers', { members: group.members.filter(m => m !== group.representative).join(', ') })}</p>
                            )}
                          </div>
                          <div className="mt-2 flex items-center text-xs text-green-600">
                            {t('group.spacesAvailable', { count: 3 - group.members.length, plural: 3 - group.members.length !== 1 ? 's' : '' })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-700">
                        💡 <strong>{t('group.join.tip')}:</strong> {t('group.selectGroupTip')}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || loading || !selectedGroupId || joinableGroups.length === 0}
                  className="flex-1 btn-primary"
                >
                  {isSubmitting ? t('group.join.submitting') : t('group.join.submit')}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('landing')}
                  className="btn-secondary"
                >
                  {t('group.create.cancel')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}