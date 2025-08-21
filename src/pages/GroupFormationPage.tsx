import React, { useState, useEffect } from 'react';
import { useBallot } from '../hooks/useBallot';

interface GroupFormationPageProps {
  onNavigate: (page: string) => void;
}

export function GroupFormationPage({ onNavigate }: GroupFormationPageProps) {
  const { 
    createGroup, 
    currentUser, 
    groups, 
    userRole, 
    loading, 
    error, 
    clearError,
    ballotResults 
  } = useBallot();
  
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user already has a group
  const existingGroup = groups.find(g => 
    g.representative.toLowerCase() === currentUser?.toLowerCase() ||
    g.members.some(m => m.toLowerCase() === currentUser?.toLowerCase())
  );

  // Redirect non-representatives
  useEffect(() => {
    if (userRole !== 'representative' && userRole !== 'admin') {
      onNavigate('landing');
    }
  }, [userRole, onNavigate]);

  const addMember = () => {
    if (!newMember.trim()) return;
    
    const email = newMember.trim().toLowerCase();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Check for duplicates
    if (members.includes(email) || email === currentUser?.toLowerCase()) {
      alert('This email is already in the group');
      return;
    }

    if (members.length >= 2) {
      alert('Groups can have maximum 3 members (including you)');
      return;
    }

    setMembers([...members, email]);
    setNewMember('');
  };

  const removeMember = (email: string) => {
    setMembers(members.filter(m => m !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Group must include the representative
    const allMembers = [currentUser, ...members];

    if (allMembers.length < 1 || allMembers.length > 3) {
      alert('Groups must have 1-3 members');
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

  if (userRole === 'guest') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h2>
          <p className="text-gray-600 mb-6">
            You need to register first before creating a group.
          </p>
          <button onClick={() => onNavigate('landing')} className="btn-primary">
            Register Now
          </button>
        </div>
      </div>
    );
  }

  if (userRole === 'user') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="text-4xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Representative Access Required</h2>
          <p className="text-gray-600 mb-6">
            Only designated representatives can create groups. Please contact an administrator to be designated as a representative.
          </p>
          <button onClick={() => onNavigate('status')} className="btn-primary">
            View My Status
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ballot Complete</h2>
          <p className="text-gray-600 mb-6">
            The ballot has been drawn. Group formation is now closed.
          </p>
          <button onClick={() => onNavigate('results')} className="btn-primary">
            View Results
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
              <h2 className="text-2xl font-bold text-gray-900">Your Group</h2>
              <p className="text-gray-600 mt-2">
                You're already part of a group
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Group Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Representative:</span>
                    <span className="font-medium">
                      {existingGroup.representative}
                      {existingGroup.representative.toLowerCase() === currentUser?.toLowerCase() && ' (You)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Group Size:</span>
                    <span className="font-medium">{existingGroup.members.length} members</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      existingGroup.status === 'approved' 
                        ? 'bg-success-100 text-success-700'
                        : existingGroup.status === 'locked'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-warning-100 text-warning-700'
                    }`}>
                      {existingGroup.status === 'pending' && '⏳ Pending Approval'}
                      {existingGroup.status === 'approved' && '✅ Approved'}
                      {existingGroup.status === 'locked' && '🔒 Locked'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Members</h3>
                <div className="space-y-2">
                  {existingGroup.members.map((member, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                      <span className="text-gray-900">{member}</span>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {member.toLowerCase() === existingGroup.representative.toLowerCase() && (
                          <span className="text-primary-600 font-medium">Rep</span>
                        )}
                        {member.toLowerCase() === currentUser?.toLowerCase() && (
                          <span className="text-success-600 font-medium">You</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => onNavigate('status')} className="btn-primary">
                  View Full Status
                </button>
                <button onClick={() => onNavigate('landing')} className="btn-secondary">
                  Back to Home
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
            <h1 className="text-3xl font-bold text-gray-900">Create Your Group</h1>
            <p className="text-gray-600 mt-2">
              You'll be the Group Representative and submit the ballot entry for everyone
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-error-600 font-semibold">⚠️ Error:</span>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Members */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Members</h3>
              
              <div className="space-y-3">
                {/* Representative (current user) */}
                <div className="flex items-center justify-between py-3 px-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <span className="font-medium text-primary-900">
                    {currentUser} <span className="text-sm font-normal">(You - Representative)</span>
                  </span>
                  <span className="text-primary-600 text-sm font-medium">👑 Rep</span>
                </div>

                {/* Added members */}
                {members.map((member, index) => (
                  <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-900">{member}</span>
                    <button
                      type="button"
                      onClick={() => removeMember(member)}
                      className="text-error-600 hover:text-error-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new member */}
              {members.length < 2 && (
                <div className="mt-4">
                  <label htmlFor="newMember" className="block text-sm font-medium text-gray-700 mb-2">
                    Add Member (Groups: 1-3 people)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      id="newMember"
                      value={newMember}
                      onChange={(e) => setNewMember(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
                      className="flex-1 input-field"
                      placeholder="member@email.com"
                      disabled={loading || isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={addMember}
                      disabled={!newMember.trim() || loading || isSubmitting}
                      className="btn-secondary whitespace-nowrap"
                    >
                      + Add Member
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 text-sm text-gray-600">
                <p>Group Size: {members.length + 1}/3 members</p>
                <p className="mt-1">⚠️ All members must be on the eligible list (self-registered or admin-added)</p>
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
                    Creating Group...
                  </span>
                ) : (
                  'Submit Group Entry'
                )}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}