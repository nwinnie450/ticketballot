import { useState } from 'react';
import { useBallot } from '../../hooks/useBallot';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const { userRole, currentUser, setAdmin } = useBallot();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleRoleSwitch = () => {
    if (userRole === 'admin') {
      setAdmin(false);
      onNavigate('landing');
    } else {
      setAdmin(true);
      onNavigate('admin-dashboard');
    }
  };

  const navItems = [
    { id: 'landing', label: 'Home', roles: ['guest', 'participant', 'admin'] },
    { id: 'registration', label: 'Register', roles: ['guest'] },
    { id: 'group-formation', label: 'Create Group', roles: ['participant'] },
    { id: 'status', label: 'My Status', roles: ['participant'] },
    { id: 'results', label: 'Results', roles: ['guest', 'participant', 'admin'] },
    { id: 'admin-dashboard', label: 'Dashboard', roles: ['admin'] },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('landing')}
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
              <div className="hidden sm:block text-sm text-gray-600">
                {currentUser}
              </div>
            )}
            
            {/* Role Switch Button */}
            <button
              onClick={handleRoleSwitch}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
              title={userRole === 'admin' ? 'Switch to User View' : 'Admin Login'}
            >
              {userRole === 'admin' ? '👤 User' : '⚙️ Admin'}
            </button>

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
                <div className="px-3 py-2 text-sm text-gray-500 border-t border-gray-200 mt-2">
                  Logged in as: {currentUser}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}