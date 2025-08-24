import { useState } from 'react';
import { useBallot } from '../hooks/useBallot';
import { useLanguage } from '../contexts/LanguageContext';
import { ballotService } from '../services/ballotService';

interface UserAuthPageProps {
  onNavigate: (page: string) => void;
}

export function UserAuthPage({ onNavigate }: UserAuthPageProps) {
  const { registerParticipant, setCurrentUser, loading, error, clearError } = useBallot();
  const { t } = useLanguage();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [wechatId, setWechatId] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !wechatId.trim()) return;

    setIsSubmitting(true);
    try {
      await registerParticipant(email.trim(), wechatId.trim());
      setCurrentUser(email.trim().toLowerCase()); // Set as current user immediately
      setEmail('');
      setWechatId('');
      setTimeout(() => {
        onNavigate('status');
      }, 1500);
    } catch (err) {
      // Error is handled by the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    try {
      const input = loginEmail.trim().toLowerCase();
      
      // Check if it's a registered participant email
      const allParticipants = ballotService.getAllParticipants();
      const participant = allParticipants.find(p => 
        p.email.toLowerCase() === input
      );

      if (participant) {
        setCurrentUser(input);
        setLoginSuccess('Welcome back! Redirecting...');
        setTimeout(() => {
          onNavigate('status');
        }, 1500);
      } else {
        throw new Error('Email not found. Please check your input or register first.');
      }

    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🎫</div>
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'register' ? t('userAuth.joinBallot') : t('userAuth.welcomeBack')}
          </h1>
          <p className="text-gray-600 mt-2">
            {mode === 'register' 
              ? t('userAuth.registerDescription') 
              : t('userAuth.loginDescription')
            }
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex mb-6 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => {
              setMode('register');
              setLoginError('');
              setLoginSuccess('');
              clearError();
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('userAuth.register')}
          </button>
          <button
            onClick={() => {
              setMode('login');
              setLoginError('');
              setLoginSuccess('');
              clearError();
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('userAuth.login')}
          </button>
        </div>

        {/* Forms */}
        <div className="card">
          {mode === 'register' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                {t('userAuth.createAccount')}
              </h2>
              
              {error && (
                <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md">
                  <div className="flex items-center">
                    <span className="text-error-600 font-semibold">⚠️ Error:</span>
                    <span className="ml-2 text-error-700">{error}</span>
                    <button 
                      onClick={clearError}
                      className="ml-auto text-error-600 hover:text-error-800"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('userAuth.emailAddress')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder={t('userAuth.emailPlaceholder')}
                    required
                    disabled={isSubmitting || loading}
                    autoComplete="email"
                  />
                </div>
                
                <div>
                  <label htmlFor="wechatId" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('userAuth.wechatId')}
                  </label>
                  <input
                    type="text"
                    id="wechatId"
                    value={wechatId}
                    onChange={(e) => setWechatId(e.target.value)}
                    className="input-field"
                    placeholder={t('userAuth.wechatPlaceholder')}
                    required
                    disabled={isSubmitting || loading}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting || loading || !email.trim() || !wechatId.trim()}
                  className="w-full btn-primary"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('userAuth.creatingAccount')}
                    </span>
                  ) : (
                    t('userAuth.createAccountBtn')
                  )}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-500">
                <p>{t('userAuth.noPasswordRequired')}</p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                {t('userAuth.loginToAccount')}
              </h2>
              
              {loginError && (
                <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md">
                  <div className="flex items-center">
                    <span className="text-error-600 font-semibold">⚠️ Error:</span>
                    <span className="ml-2 text-error-700">{loginError}</span>
                    <button 
                      onClick={() => setLoginError('')}
                      className="ml-auto text-error-600 hover:text-error-800"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {loginSuccess && (
                <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-md">
                  <span className="text-success-700 text-sm">✅ {loginSuccess}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('userAuth.emailAddress')}
                  </label>
                  <input
                    type="email"
                    id="loginEmail"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="input-field"
                    placeholder={t('userAuth.emailPlaceholder')}
                    required
                    disabled={isSubmitting}
                    autoComplete="email"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('userAuth.emailForLogin')}
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !loginEmail.trim()}
                  className="w-full btn-primary"
                >
                  {isSubmitting ? t('userAuth.loggingIn') : t('userAuth.loginBtn')}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-500">
                <p>{t('userAuth.passwordFreeLogin')}</p>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 text-center space-y-2">
          <button 
            onClick={() => onNavigate('landing')} 
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {t('userAuth.backToHome')}
          </button>
          
          <div className="text-xs text-gray-400">
            {t('userAuth.needAdminAccess')}{' '}
            <button 
              onClick={() => onNavigate('admin-login')} 
              className="text-blue-600 hover:text-blue-700 underline"
            >
              {t('userAuth.adminLogin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}