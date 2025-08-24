import { useState } from 'react';
import { useBallot } from '../hooks/useBallot';
import { useLanguage } from '../contexts/LanguageContext';

interface StatusPageProps {
  onNavigate: (page: string) => void;
}

export function StatusPage({ onNavigate }: StatusPageProps) {
  const { t } = useLanguage();
  const { 
    currentUser, 
    groups, 
    participants, 
    ballotResults, 
    setCurrentUser,
    drawForGroup,
    getBallotStatus,
    loading,
    error,
    clearError
  } = useBallot();
  
  const [emailInput, setEmailInput] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState<number | null>(null);
  const [showDrawResult, setShowDrawResult] = useState(false);

  const userGroup = groups.find(g => 
    g.representative.toLowerCase() === currentUser?.toLowerCase() ||
    g.members.some(m => m.toLowerCase() === currentUser?.toLowerCase())
  );

  const isUserRegistered = currentUser && participants.some(p => 
    p.email.toLowerCase() === currentUser.toLowerCase()
  );

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setCurrentUser(emailInput.trim().toLowerCase());
    }
  };

  const getUserPosition = () => {
    if (!ballotResults || !userGroup) return null;
    
    const entry = ballotResults.entries.find(e => e.groupId === userGroup.id);
    return entry?.position || null;
  };

  const userPosition = getUserPosition();

  // Handle ballot drawing
  const handleDrawBallot = async () => {
    if (!userGroup || !currentUser) return;
    
    setIsDrawing(true);
    clearError();
    
    try {
      const position = await drawForGroup(userGroup.id, currentUser);
      setDrawResult(position);
      setShowDrawResult(true);
      
      // Auto-hide the result modal after 5 seconds
      setTimeout(() => {
        setShowDrawResult(false);
      }, 5000);
    } catch (err) {
      console.error('Failed to draw ballot:', err);
    } finally {
      setIsDrawing(false);
    }
  };

  const ballotStatus = getBallotStatus();
  const isRepresentative = userGroup?.representative.toLowerCase() === currentUser?.toLowerCase();

  // Guest view - ask for email
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-md">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900">{t('status.checkStatus')}</h2>
            <p className="text-gray-600 mt-2">
              {t('status.enterEmail')}
            </p>
          </div>
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('status.emailAddress')}
              </label>
              <input
                type="email"
                id="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="mt-1 input-field"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <button type="submit" className="w-full btn-primary">
              {t('status.checkStatusButton')}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            {t('status.notRegisteredYet')}{' '}
            <button 
              onClick={() => onNavigate('landing')} 
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('status.registerNow')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not registered
  if (!isUserRegistered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Not Registered</h2>
          <p className="text-gray-600 mb-6">
            The email <strong>{currentUser}</strong> is not registered for this ballot.
          </p>
          
          <div className="space-y-3">
            <button onClick={() => onNavigate('landing')} className="w-full btn-primary">
              Register Now
            </button>
            <button onClick={() => setCurrentUser(null)} className="w-full btn-secondary">
              Check Different Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registered but no group
  if (!userGroup) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">✅</div>
              <h1 className="text-3xl font-bold text-gray-900">{t('status.youreRegistered')}</h1>
              <p className="text-gray-600 mt-2">{currentUser}</p>
            </div>

            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <span className="text-warning-600 text-2xl mr-3">⏳</span>
                <div>
                  <h3 className="font-semibold text-warning-800">{t('status.noGroupYet')}</h3>
                  <p className="text-warning-700 mt-1">
                    {t('status.noGroupDescription')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">{t('status.whatsNext')}</h3>
              
              {!ballotResults ? (
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-primary-600 font-bold">1.</span>
                    <div>
                      <p className="font-medium text-gray-900">{t('status.createGroupStep')}</p>
                      <p className="text-sm text-gray-600">{t('status.becomeRepresentative')}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-primary-600 font-bold">2.</span>
                    <div>
                      <p className="font-medium text-gray-900">{t('status.waitForApproval')}</p>
                      <p className="text-sm text-gray-600">{t('status.adminValidation')}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-primary-600 font-bold">3.</span>
                    <div>
                      <p className="font-medium text-gray-900">{t('status.ballotDraw')}</p>
                      <p className="text-sm text-gray-600">{t('status.randomSelection')}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-2xl mb-2">🎯</div>
                  <p className="text-gray-600">
                    The ballot has been drawn, but you weren't part of any group. 
                    Better luck next time!
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6">
              {!ballotResults && (
                <button onClick={() => onNavigate('group-formation')} className="btn-primary">
                  {t('status.createGroupButton')}
                </button>
              )}
              <button onClick={() => onNavigate('landing')} className="btn-secondary">
                {t('status.backToHome')}
              </button>
              {ballotResults && (
                <button onClick={() => onNavigate('results')} className="btn-primary">
                  {t('status.viewResults')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has group - show full status
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* User Info Card */}
        <div className="card">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">📋</div>
            <h1 className="text-3xl font-bold text-gray-900">{t('status.yourStatus')}</h1>
            <p className="text-gray-600 mt-2">{currentUser}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-success-600 text-2xl mr-3">✅</span>
                <div>
                  <p className="font-semibold text-success-800">{t('status.registered')}</p>
                  <p className="text-sm text-success-700">{t('status.readyToParticipate')}</p>
                </div>
              </div>
            </div>

            <div className={`border rounded-lg p-4 ${
              userGroup.status === 'approved' 
                ? 'bg-success-50 border-success-200' 
                : userGroup.status === 'locked'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-warning-50 border-warning-200'
            }`}>
              <div className="flex items-center">
                <span className={`text-2xl mr-3 ${
                  userGroup.status === 'approved' 
                    ? 'text-success-600' 
                    : userGroup.status === 'locked'
                    ? 'text-blue-600'
                    : 'text-warning-600'
                }`}>
                  {userGroup.status === 'approved' && '✅'}
                  {userGroup.status === 'locked' && '🔒'}
                  {userGroup.status === 'pending' && '⏳'}
                  {userGroup.status === 'ballot-ready' && '🎯'}
                  {userGroup.status === 'ballot-drawn' && '🎲'}
                </span>
                <div>
                  <p className={`font-semibold ${
                    userGroup.status === 'approved' 
                      ? 'text-success-800' 
                      : userGroup.status === 'locked'
                      ? 'text-blue-800'
                      : 'text-warning-800'
                  }`}>
                    {userGroup.status === 'approved' && t('status.groupApproved')}
                    {userGroup.status === 'locked' && t('status.ballotComplete')}
                    {userGroup.status === 'pending' && t('status.pendingApproval')}
                    {userGroup.status === 'ballot-ready' && t('status.readyToDraw')}
                    {userGroup.status === 'ballot-drawn' && t('status.drawComplete')}
                  </p>
                  <p className={`text-sm ${
                    userGroup.status === 'approved' 
                      ? 'text-success-700' 
                      : userGroup.status === 'locked'
                      ? 'text-blue-700'
                      : 'text-warning-700'
                  }`}>
                    {userGroup.status === 'approved' && t('status.readyForBallotDraw')}
                    {userGroup.status === 'locked' && t('status.resultsAvailable')}
                    {userGroup.status === 'pending' && t('status.waitingForAdminValidation')}
                    {userGroup.status === 'ballot-ready' && isRepresentative ? t('status.clickToDrawPosition') : t('status.waitingForRepresentative')}
                    {userGroup.status === 'ballot-drawn' && userGroup.ballotPosition && t('status.positionDrawn', { position: userGroup.ballotPosition })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Group Details Card */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('status.groupDetails')}</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <span className="text-sm font-medium text-gray-600">{t('status.representative')}:</span>
                  <p className="text-gray-900">
                    {userGroup.representative}
                    {userGroup.representative.toLowerCase() === currentUser.toLowerCase() && (
                      <span className="ml-2 text-primary-600 font-medium">👑 {t('status.you')}</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">{t('status.groupSize')}:</span>
                  <p className="text-gray-900">{userGroup.members.length} {t('status.members')}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">{t('status.members')}</h3>
              <div className="space-y-2">
                {userGroup.members.map((member, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                    <span className="text-gray-900">{member}</span>
                    <div className="flex items-center space-x-2 text-sm">
                      {member.toLowerCase() === userGroup.representative.toLowerCase() && (
                        <span className="text-primary-600 font-medium">{t('status.rep')}</span>
                      )}
                      {member.toLowerCase() === currentUser.toLowerCase() && (
                        <span className="text-success-600 font-medium">{t('status.you')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ballot Drawing Card */}
        {userGroup && userGroup.status === 'ballot-ready' && isRepresentative && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('status.timeToDraw')}</h2>
            
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-primary-900 mb-2">
                  {t('status.groupReadyForBallot')}
                </h3>
                <p className="text-primary-700 mb-4">
                  {t('status.asRepresentativeOf')} <strong>{userGroup.name || 'your group'}</strong>{t('status.youCanNowDraw')}
                </p>
                <p className="text-sm text-primary-600">
                  {t('status.clickButtonToDraw')}
                </p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleDrawBallot}
                disabled={isDrawing || loading}
                className="btn-primary text-lg px-8 py-3 min-w-[200px]"
              >
                {isDrawing ? (
                  <>
                    <span className="inline-block animate-spin mr-2">🎲</span>
                    {t('status.drawing')}
                  </>
                ) : (
                  <>
                    {t('status.drawPosition')}
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-error-700 text-sm">⚠️ {error}</p>
              </div>
            )}
          </div>
        )}

        {/* Draw Result Modal */}
        {showDrawResult && drawResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {t('status.positionDrawn', { position: drawResult })}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('status.groupDrawnPosition', { position: drawResult })}
              </p>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  {t('status.waitingForAllGroups')}
                </p>
                <button
                  onClick={() => setShowDrawResult(false)}
                  className="btn-primary w-full"
                >
                  {t('status.continue')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ballot Status Info */}
        {ballotStatus === 'in-progress' && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('status.ballotStatus')}</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="text-blue-600 text-2xl">ℹ️</span>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">{t('status.ballotInProgress')}</h3>
                  <p className="text-blue-700 text-sm">
                    {userGroup?.status === 'ballot-drawn' 
                      ? t('status.groupCompletedDraw')
                      : isRepresentative 
                      ? t('status.youCanDrawNow')
                      : t('status.waitingForRepresentative')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ballot Results Card */}
        {ballotResults && ballotResults.ballotStatus === 'completed' && userPosition && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('status.ballotResults')}</h2>
            
            <div className="text-center py-6">
              <div className={`text-6xl mb-4 ${
                userPosition <= 3 ? 'text-success-600' : 'text-gray-600'
              }`}>
                {userPosition === 1 && '🏆'}
                {userPosition === 2 && '🥈'}
                {userPosition === 3 && '🥉'}
                {userPosition > 3 && '🎫'}
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {t('status.positionDrawn', { position: userPosition })}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {t('status.positionInQueue', { position: userPosition })}
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p>{t('status.drawnOn')}: {new Date(ballotResults.drawnAt).toLocaleString()}</p>
                <p>{t('status.totalGroups')}: {ballotResults.totalGroups}</p>
                <p>{t('status.totalParticipants')}: {ballotResults.totalParticipants}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={() => onNavigate('landing')} className="btn-secondary">
            {t('status.backToHome')}
          </button>
          {ballotResults ? (
            <button onClick={() => onNavigate('results')} className="btn-primary">
              {t('status.viewFullResults')}
            </button>
          ) : (
            <button onClick={() => window.location.reload()} className="btn-secondary">
              🔄 {t('status.refreshStatus')}
            </button>
          )}
          <button onClick={() => setCurrentUser(null)} className="btn-secondary">
            {t('status.checkDifferentEmail')}
          </button>
        </div>
      </div>
    </div>
  );
}