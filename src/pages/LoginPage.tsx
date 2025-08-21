import { useState } from 'react';
import { useBallot } from '../hooks/useBallot';
import { authService } from '../services/authService';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { setCurrentUser, participants } = useBallot();
  const [step, setStep] = useState<'identify' | 'authenticate'>('identify');
  const [identifier, setIdentifier] = useState(''); // username or email
  const [userType, setUserType] = useState<'user' | 'admin' | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const input = identifier.trim().toLowerCase();
      
      // Check if it's an admin username (check with authService or default 'admin')
      const isAdmin = input === 'admin' || authService.getAdmins().some(admin => 
        admin.username.toLowerCase() === input
      );

      if (isAdmin) {
        setUserType('admin');
        setStep('authenticate');
        setSuccess('Admin account detected. Please enter your password.');
      } else {
        // Check if it's a registered participant email
        const isUser = participants.some(p => 
          p.email.toLowerCase() === input
        );

        if (isUser) {
          setUserType('user');
          setStep('authenticate');
          setSuccess('User account detected. Click continue to login.');
        } else {
          throw new Error('Username/email not found. Please check your input or register first.');
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Identification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (userType === 'admin') {
        // Admin login
        authService.login(identifier, password);
        setSuccess('Admin login successful!');
        setTimeout(() => {
          onNavigate('admin-dashboard');
        }, 1000);
      } else if (userType === 'user') {
        // User login (no password needed for now, just verify they exist)
        setCurrentUser(identifier.toLowerCase());
        setSuccess('User login successful!');
        setTimeout(() => {
          onNavigate('status');
        }, 1000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('identify');
    setUserType(null);
    setPassword('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 'identify' ? 'Login' : 'Enter Password'}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 'identify' 
              ? 'Enter your username or email address' 
              : `${userType === 'admin' ? 'Admin' : 'User'} login`
            }
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center mb-6">
          <div className={`flex-1 h-1 rounded-full ${step === 'identify' ? 'bg-primary-600' : 'bg-primary-200'}`}></div>
          <div className="mx-2 text-xs text-gray-500">→</div>
          <div className={`flex-1 h-1 rounded-full ${step === 'authenticate' ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
            <span className="text-error-700 text-sm">⚠️ {error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg">
            <span className="text-success-700 text-sm">✅ {success}</span>
          </div>
        )}

        {/* Step 1: Identify User */}
        {step === 'identify' && (
          <form onSubmit={handleIdentify} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="input-field"
                placeholder="admin or your-email@example.com"
                required
                disabled={loading}
                autoComplete="username email"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter 'admin' for admin access or your registered email for user access
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="btn-primary w-full"
            >
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Step 2: Authentication */}
        {step === 'authenticate' && (
          <div>
            {/* Show identified user info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">
                  {userType === 'admin' ? '⚙️' : '👤'}
                </span>
                <div>
                  <div className="font-medium text-blue-800">
                    {userType === 'admin' ? 'Admin Account' : 'User Account'}
                  </div>
                  <div className="text-sm text-blue-600">{identifier}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleAuthenticate} className="space-y-4">
              {userType === 'admin' ? (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter your admin password"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ User account verified. Click continue to proceed.
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="btn-secondary flex-1"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading || (userType === 'admin' && !password)}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>

            {/* Default Credentials Helper for Admin */}
            {userType === 'admin' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-800 mb-1">Default Password:</h4>
                <div className="text-sm text-yellow-700">
                  <code className="bg-yellow-100 px-1 rounded">password</code>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Links */}
        <div className="mt-6 text-center space-y-2">
          <button 
            onClick={() => onNavigate('landing')} 
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Home
          </button>
          
          {step === 'identify' && (
            <div className="text-xs text-gray-500">
              Not registered? <button 
                onClick={() => onNavigate('landing')} 
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Register here
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}