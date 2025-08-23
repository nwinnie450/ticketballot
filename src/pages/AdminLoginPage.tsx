import { useState } from 'react';
import { authService } from '../services/authService';

interface AdminLoginPageProps {
  onNavigate: (page: string) => void;
  onLoginSuccess: () => void;
}

export function AdminLoginPage({ onNavigate, onLoginSuccess }: AdminLoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      authService.login(username.trim(), password);
      onLoginSuccess();
      onNavigate('admin-dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">⚙️</div>
          <h1 className="text-3xl font-bold text-gray-900">Administrator Login</h1>
          <p className="text-gray-600 mt-2">
            Secure access to ballot administration panel
          </p>
          <div className="inline-flex items-center px-3 py-1 mt-3 text-xs font-medium text-red-700 bg-red-100 border border-red-200 rounded-full">
            🔒 Admin Access Only
          </div>
        </div>

        {/* Login Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-error-600 font-semibold">⚠️ Error:</span>
                  <span className="ml-2 text-error-700">{error}</span>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Enter admin username"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

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
                placeholder="Enter password"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full btn-primary"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => onNavigate('landing')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              ← Back to Public Site
            </button>
            
            <div className="text-xs text-gray-400">
              Regular user?{' '}
              <button 
                onClick={() => onNavigate('user-auth')} 
                className="text-blue-600 hover:text-blue-700 underline"
              >
                User Registration/Login
              </button>
            </div>
          </div>
        </div>

        {/* Default Credentials Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">🚀 First Time Setup</h3>
          <div className="text-sm text-blue-700">
            <p><strong>Default Login:</strong></p>
            <p>Username: <code className="bg-blue-100 px-1 rounded">admin</code></p>
            <p>Password: <code className="bg-blue-100 px-1 rounded">password</code></p>
            <p className="mt-2 text-xs">
              ⚠️ Please change the default password after first login
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 gap-4 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-semibold text-gray-900">Manage Participants</h3>
            <p className="text-sm text-gray-600">Add, remove, and view all participants</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900">Run Ballot</h3>
            <p className="text-sm text-gray-600">Execute fair randomized ballot draws</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900">View Results</h3>
            <p className="text-sm text-gray-600">Export and analyze ballot results</p>
          </div>
        </div>
      </div>
    </div>
  );
}