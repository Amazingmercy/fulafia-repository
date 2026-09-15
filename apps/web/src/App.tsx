import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserDto } from '@fulafia/shared';
import { authApi } from './services/api';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UIProvider } from './components/UIProvider';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { WorkDetail } from './pages/WorkDetail';
import { SubmitWork } from './pages/SubmitWork';
import { ReviewQueue } from './pages/ReviewQueue';
import { AdminPanel } from './pages/AdminPanel';
import { MySubmissions } from './pages/MySubmissions';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const queryClient = new QueryClient();

// Pages that own their own full-width layout (no container wrapper)
const FULL_WIDTH_PAGES = new Set(['home', 'login', 'register']);

export const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authApi.getMe()
        .then(setCurrentUser)
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoadingAuth(false));
    } else {
      setLoadingAuth(false);
    }
  }, []);

  const handleLoginSuccess = (user: UserDto, accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setCurrentUser(user);
    // After login → go straight to Browse
    setCurrentPage('catalog');
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (e) { console.error(e); }
    finally {
      setCurrentUser(null);
      setCurrentPage('home');
    }
  };

  const handleSelectWork = (id: string) => {
    setSelectedWorkId(id);
    setCurrentPage('work-detail');
  };

  const renderPage = () => {
    if (currentPage === 'work-detail' && selectedWorkId) {
      return (
        <WorkDetail
          workId={selectedWorkId}
          currentUser={currentUser}
          onBack={() => setCurrentPage(currentUser ? 'catalog' : 'home')}
        />
      );
    }

    switch (currentPage) {
      case 'home':
        return (
          <Home
            onNavigate={setCurrentPage}
            isLoggedIn={!!currentUser}
          />
        );

      case 'catalog':
      case 'browse':
        return currentUser ? (
          <Catalog onSelectWork={handleSelectWork} />
        ) : (
          // Guard: non-logged-in users who somehow reach this route go to login
          <Login onLoginSuccess={handleLoginSuccess} onNavigateRegister={() => setCurrentPage('register')} />
        );

      case 'my-submissions':
        return currentUser ? (
          <MySubmissions
            currentUser={currentUser}
            onSelectWork={handleSelectWork}
            onNavigate={setCurrentPage}
          />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} onNavigateRegister={() => setCurrentPage('register')} />
        );

      case 'submit':
        return currentUser ? (
          <SubmitWork
            currentUser={currentUser}
            onSuccess={(newWorkId) => {
              setSelectedWorkId(newWorkId);
              setCurrentPage('work-detail');
            }}
          />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} onNavigateRegister={() => setCurrentPage('register')} />
        );

      case 'review':
        return currentUser ? (
          <ReviewQueue currentUser={currentUser} onSelectWork={handleSelectWork} />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} onNavigateRegister={() => setCurrentPage('register')} />
        );

      case 'admin':
        return currentUser ? (
          <AdminPanel />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} onNavigateRegister={() => setCurrentPage('register')} />
        );

      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} onNavigateRegister={() => setCurrentPage('register')} />;

      case 'register':
        return <Register onRegisterSuccess={handleLoginSuccess} onNavigateLogin={() => setCurrentPage('login')} />;

      default:
        return <Home onNavigate={setCurrentPage} isLoggedIn={!!currentUser} />;
    }
  };

  if (loadingAuth) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-white)', color: 'var(--color-shark)', fontWeight: 600 }}>
        Initializing FULafia Institutional Repository…
      </div>
    );
  }

  const isFullWidth = FULL_WIDTH_PAGES.has(currentPage);

  return (
    <div className="app-container">
      <Header
        currentUser={currentUser}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        onLogout={handleLogout}
      />

      <main style={isFullWidth
        ? { flex: 1, width: '100%' }
        : { flex: 1, width: '100%', maxWidth: 'var(--max-width-container)', margin: '0 auto', padding: '2rem 1.5rem' }
      }>
        {renderPage()}
      </main>

      <Footer onNavigate={setCurrentPage} />
    </div>
  );
};

export const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <UIProvider>
      <AppContent />
    </UIProvider>
  </QueryClientProvider>
);
