import { useState, useEffect } from 'react';
import { BallotProvider } from './hooks/useBallot';
import { LanguageProvider } from './contexts/LanguageContext';
import { Header } from './components/layout/Header';
import { LandingPage } from './pages/LandingPage';
import { GroupFormationPage } from './pages/GroupFormationPage';
import { StatusPage } from './pages/StatusPage';
import { ResultsPage } from './pages/ResultsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { LoginPage } from './pages/LoginPage';
import { UserAuthPage } from './pages/UserAuthPage';
import { DemoButton } from './components/ui/DemoButton';
import type { PageType } from './types';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>(() => {
    // Load saved page from localStorage or default to 'landing'
    return (localStorage.getItem('currentPage') as PageType) || 'landing';
  });

  const handleNavigate = (page: string) => {
    const newPage = page as PageType;
    setCurrentPage(newPage);
    // Save current page to localStorage
    localStorage.setItem('currentPage', newPage);
  };

  // Clear saved page when navigating to landing (for fresh start)
  useEffect(() => {
    if (currentPage === 'landing') {
      localStorage.removeItem('currentPage');
    }
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'group-formation':
        return <GroupFormationPage onNavigate={handleNavigate} />;
      case 'status':
        return <StatusPage onNavigate={handleNavigate} />;
      case 'results':
        return <ResultsPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'user-auth':
        return <UserAuthPage onNavigate={handleNavigate} />;
      case 'admin-login':
        return <AdminLoginPage onNavigate={handleNavigate} onLoginSuccess={() => {}} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'admin-settings':
        return <AdminSettingsPage onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Header onNavigate={handleNavigate} currentPage={currentPage} />
      {renderPage()}
      <DemoButton />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <BallotProvider>
        <AppContent />
      </BallotProvider>
    </LanguageProvider>
  );
}

export default App;
