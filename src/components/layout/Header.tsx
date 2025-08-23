import { useState } from 'react';
import { useBallot } from '../../hooks/useBallot';
import { authService } from '../../services/authService';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const { userRole, currentUser, setCurrentUser } = useBallot();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const isAdminAuthenticated = authService.isAuthenticated();
  const currentAdmin = authService.getCurrentAdmin();

  const handleHomeClick = () => {
    // If admin is authenticated, go to admin dashboard
    if (isAdminAuthenticated) {
      onNavigate('admin-dashboard');
      return;
    }
    
    // If user is logged in, go to status page  
    if (userRole === 'user' || userRole === 'representative') {
      onNavigate('status');
      return;
    }
    
    // Guests go to landing page to register/login
    onNavigate('landing');
  };

  const handleAdminAction = () => {
    if (isAdminAuthenticated) {
      // If admin is logged in, show logout option or go to dashboard
      if (currentPage === 'admin-dashboard' || currentPage === 'admin-settings') {
        authService.logout();
        onNavigate('landing');
      } else {
        onNavigate('admin-dashboard');
      }
    } else {
      // If not logged in, go to login page
      onNavigate('admin-login');
    }
  };

  const navItems = [
    { id: 'landing', label: 'Home', roles: ['guest', 'user', 'representative', 'admin'] },
    // Only show Register for guests (not logged in users)
    { id: 'registration', label: 'Register', roles: ['guest'] },
    { id: 'group-formation', label: 'Create Group', roles: ['user', 'representative'] },
    { id: 'status', label: 'My Status', roles: ['user', 'representative'] },
    { id: 'results', label: 'Results', roles: ['guest', 'user', 'representative', 'admin'] },
  ];

  // Add login option for guests
  const loginItems = !currentUser && !isAdminAuthenticated ? [
    { id: 'user-auth', label: '🔐 Register/Login', roles: ['guest'] },
  ] : [];

  // Add admin navigation items if authenticated
  const adminNavItems = isAdminAuthenticated ? [
    { id: 'admin-dashboard', label: 'Dashboard', roles: ['admin'] },
    { id: 'admin-settings', label: 'Admin Settings', roles: ['admin'] },
  ] : [];

  const allNavItems = [...navItems, ...loginItems, ...adminNavItems];
  const visibleItems = allNavItems.filter(item => 
    item.roles.includes(userRole) || (isAdminAuthenticated && item.roles.includes('admin'))
  );

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={handleHomeClick}
              className="flex items-center space-x-2 text-xl font-bold text-primary-600 hover:text-primary-700"
            >
              <span className="text-2xl">🎫</span>
              <span className="hidden sm:block">Ticket Ballot</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {visibleItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentPage === item.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {currentUser && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <span>{currentUser}</span>
                <button
                  onClick={() => {
                    if (confirm('Logout from current user session?')) {
                      setCurrentUser(null);
                      onNavigate('landing');
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                  title="Logout User"
                >
                  logout
                </button>
              </div>
            )}
            
            {/* Login/Admin Button */}
            {!currentUser && !isAdminAuthenticated ? (
              <button
                onClick={() => onNavigate('user-auth')}
                className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                title="Register or Login"
              >
                🔐 Join
              </button>
            ) : isAdminAuthenticated ? (
              <button
                onClick={handleAdminAction}
                className="text-sm bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1 rounded-full transition-colors"
                title={currentPage.startsWith('admin-') ? 'Logout' : 'Admin Dashboard'}
              >
                {currentPage.startsWith('admin-') ? '🚪 Logout' : '⚙️ Dashboard'}
              </button>
            ) : (
              <button
                onClick={() => onNavigate('user-auth')}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                title="Switch User / Login"
              >
                🔄 Switch
              </button>
            )}
            
            {/* Show current superadmin name if logged in */}
            {isAdminAuthenticated && currentAdmin && (
              <div className="hidden sm:block text-xs text-gray-500">
                Superadmin: {currentAdmin}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <span className="sr-only">Open main menu</span>
              {showMobileMenu ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {visibleItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setShowMobileMenu(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    currentPage === item.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              
              {currentUser && (
                <div className="px-3 py-2 text-sm text-gray-500 border-t border-gray-200 mt-2 flex items-center justify-between">
                  <span>Logged in as: {currentUser}</span>
                  <button
                    onClick={() => {
                      if (confirm('Logout from current user session?')) {
                        setCurrentUser(null);
                        onNavigate('landing');
                        setShowMobileMenu(false);
                      }
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                    title="Logout User"
                  >
                    logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}