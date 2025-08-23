import { useEffect } from 'react';
import { useBallot } from '../hooks/useBallot';
import { authService } from '../services/authService';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { userRole, stats } = useBallot();
  const isAdminAuthenticated = authService.isAuthenticated();

  // Auto-redirect based on user role
  useEffect(() => {
    // If admin is authenticated, redirect to admin dashboard
    if (isAdminAuthenticated) {
      onNavigate('admin-dashboard');
      return;
    }
    
    // If user is logged in (not guest), redirect to status page
    if (userRole === 'user' || userRole === 'representative') {
      onNavigate('status');
      return;
    }
    
    // Guests stay on landing page to register/login
  }, [isAdminAuthenticated, userRole, onNavigate]);

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
                      {userRole === 'guest' && (
                        <div className="flex items-center text-gray-600">
                          <span className="text-primary-600 font-bold mr-2">1️⃣</span>
                          Register your interest
                        </div>
                      )}
                      <div className="flex items-center text-gray-600">
                        <span className="text-primary-600 font-bold mr-2">{userRole === 'guest' ? '2️⃣' : '1️⃣'}</span>
                        Form groups (1-3 people)
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="text-primary-600 font-bold mr-2">{userRole === 'guest' ? '3️⃣' : '2️⃣'}</span>
                        Random ballot determines order
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="mt-12 lg:mt-0 lg:w-1/2 lg:pl-12">
                  <div className="card max-w-md mx-auto">
                    {userRole === 'guest' ? (
                      <div className="text-center">
                        <div className="text-4xl mb-4">🎫</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Join the Ballot</h2>
                        <p className="text-gray-600 mb-6">
                          Register now to participate in the fair ticket ballot system.
                        </p>
                        <div className="space-y-3">
                          <button 
                            onClick={() => onNavigate('user-auth')} 
                            className="w-full btn-primary"
                          >
                            Register / Login
                          </button>
                          <button 
                            onClick={() => onNavigate('status')} 
                            className="w-full btn-secondary"
                          >
                            Check Status
                          </button>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-2">Administrator?</div>
                          <button 
                            onClick={() => onNavigate('admin-login')} 
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            🔐 Admin Login
                          </button>
                        </div>
                      </div>
                    ) : (userRole === 'user' || userRole === 'representative') ? (
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