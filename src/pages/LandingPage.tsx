import React, { useState } from 'react';
import { useBallot } from '../hooks/useBallot';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { registerParticipant, userRole, stats, loading, error, clearError } = useBallot();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await registerParticipant(email.trim());
      setEmail('');
      // Auto-navigate to next step
      setTimeout(() => {
        onNavigate('group-formation');
      }, 1500);
    } catch (err) {
      // Error is handled by the context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="text-center lg:text-left lg:flex lg:items-center lg:justify-between">
                <div className="lg:w-1/2">
                  <h1 className="text-4xl tracking-tight font-bold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Fair & Transparent</span>
                    <span className="block text-primary-600">Ticket Ballot</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Get your chance at tickets through our randomized ballot system. 
                    Form groups, submit entries, and let fairness decide.
                  </p>

                  {/* Quick Stats */}
                  {stats.totalParticipants > 0 && (
                    <div className="mt-6 flex flex-wrap gap-6 justify-center lg:justify-start">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">{stats.totalParticipants}</div>
                        <div className="text-sm text-gray-600">Participants</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">{stats.totalGroups}</div>
                        <div className="text-sm text-gray-600">Groups Formed</div>
                      </div>
                      {stats.hasResults && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-success-600">✓</div>
                          <div className="text-sm text-gray-600">Ballot Complete</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* How it Works */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works:</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <span className="text-primary-600 font-bold mr-2">1️⃣</span>
                        Register your interest
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="text-primary-600 font-bold mr-2">2️⃣</span>
                        Form groups (1-3 people)
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="text-primary-600 font-bold mr-2">3️⃣</span>
                        Random ballot determines order
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registration Form */}
                <div className="mt-12 lg:mt-0 lg:w-1/2 lg:pl-12">
                  <div className="card max-w-md mx-auto">
                    {userRole === 'guest' ? (
                      <>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                          Register Your Interest
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
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="mt-1 input-field"
                              placeholder="your@email.com"
                              required
                              disabled={isSubmitting || loading}
                            />
                          </div>
                          
                          <button
                            type="submit"
                            disabled={isSubmitting || loading || !email.trim()}
                            className="w-full btn-primary"
                          >
                            {isSubmitting ? (
                              <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Registering...
                              </span>
                            ) : (
                              'Register to Participate'
                            )}
                          </button>
                        </form>

                        <div className="mt-4 text-center text-sm text-gray-600">
                          Already registered?{' '}
                          <button 
                            onClick={() => onNavigate('status')} 
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Check your status →
                          </button>
                        </div>
                      </>
                    ) : userRole === 'participant' ? (
                      <div className="text-center">
                        <div className="text-4xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">You're Registered!</h2>
                        <p className="text-gray-600 mb-6">
                          Ready to form a group or check your status.
                        </p>
                        <div className="space-y-3">
                          <button 
                            onClick={() => onNavigate('group-formation')} 
                            className="w-full btn-primary"
                          >
                            Create/Join Group
                          </button>
                          <button 
                            onClick={() => onNavigate('status')} 
                            className="w-full btn-secondary"
                          >
                            Check My Status
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-4xl mb-4">⚙️</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Mode</h2>
                        <p className="text-gray-600 mb-6">
                          Manage participants, groups, and run the ballot.
                        </p>
                        <button 
                          onClick={() => onNavigate('admin-dashboard')} 
                          className="w-full btn-primary"
                        >
                          Go to Dashboard
                        </button>
                      </div>
                    )}
                  </div>

                  {/* View Results Link */}
                  {stats.hasResults && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => onNavigate('results')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                      >
                        <span className="mr-2">🎯</span>
                        View Ballot Results
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}