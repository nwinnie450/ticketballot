import { useState } from 'react';
import { BallotProvider } from './hooks/useBallot';
import { Header } from './components/layout/Header';
import { LandingPage } from './pages/LandingPage';
import { GroupFormationPage } from './pages/GroupFormationPage';
import { StatusPage } from './pages/StatusPage';
import { ResultsPage } from './pages/ResultsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { DemoButton } from './components/ui/DemoButton';
import { authService } from './services/authService';
import type { PageType } from './types';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [authRefresh, setAuthRefresh] = useState(0);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageType);
  };

  const handleAuthChange = () => {
    setAuthRefresh(prev => prev + 1);
  };

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
      case 'admin-login':
        return <AdminLoginPage onNavigate={handleNavigate} onLoginSuccess={handleAuthChange} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'admin-settings':
        return <AdminSettingsPage onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={handleNavigate} currentPage={currentPage} />
      {renderPage()}
      <DemoButton />
    </div>
  );
}

function App() {
  return (
    <BallotProvider>
      <AppContent />
    </BallotProvider>
  );
}

export default App;
