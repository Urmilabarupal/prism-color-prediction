import React, { useState, useEffect } from 'react';
import { PageId } from './types.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { GameProvider, useGame } from './context/GameContext.js';
import { SplashScreen } from './components/SplashScreen.js';
import { BottomNav } from './components/BottomNav.js';
import { WinLossModal } from './components/WinLossModal.js';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { GamePage } from './pages/GamePage.js';
import { ResultPage } from './pages/ResultPage.js';
import { WalletPage } from './pages/WalletPage.js';
import { RechargePage } from './pages/RechargePage.js';
import { WithdrawPage } from './pages/WithdrawPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { InvitePage } from './pages/InvitePage.js';
import { CustomerServicePage } from './pages/CustomerServicePage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { VipCenterPage } from './pages/VipCenterPage.js';
import { TaskCenterPage } from './pages/TaskCenterPage.js';
import { ManagerPortalApp } from './manager/ManagerPortalApp.js';
import { Shield, ShieldAlert, Sliders } from 'lucide-react';

const GlobalWinLossModal: React.FC<{ onNavigate: (page: PageId) => void }> = ({ onNavigate }) => {
  const { lastWinResult, clearLastWinResult } = useGame();
  if (!lastWinResult) return null;
  return (
    <WinLossModal
      data={lastWinResult}
      onClose={clearLastWinResult}
      onViewDetails={() => {
        clearLastWinResult();
        onNavigate('game');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-my-records'));
        }, 50);
      }}
    />
  );
};

const MainApp: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageId>('home');

  // Splash screen transition
  const handleSplashFinish = React.useCallback(() => {
    setShowSplash(false);
    if (!user) {
      // If user isn't logged in, direct to login page
      setCurrentPage('login');
    } else {
      setCurrentPage('home');
    }
  }, [user]);

  const handleNavigate = (page: PageId) => {
    // If navigating to game/wallet/profile/etc without auth, prompt login
    if (!user && page !== 'home' && page !== 'result' && page !== 'support' && page !== 'login') {
      setCurrentPage('login');
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('login');
  };

  // If currently in Manager Portal mode, render full-screen responsive portal
  if (currentPage === 'manager') {
    return <ManagerPortalApp onSwitchToUserApp={() => handleNavigate('home')} />;
  }

  // Determine whether to show bottom navigation bar
  const showBottomNav =
    !showSplash &&
    currentPage !== 'login' &&
    currentPage !== 'recharge' &&
    currentPage !== 'withdraw';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start sm:py-6 relative">
      {/* Mobile Device Frame for Desktop & Direct Mobile View */}
      <div className="w-full max-w-[440px] min-h-screen sm:min-h-[880px] bg-[#F6F7FB] text-slate-800 shadow-xl relative flex flex-col overflow-x-hidden sm:rounded-3xl sm:border sm:border-slate-200/80">
        {showSplash ? (
          <SplashScreen onFinish={handleSplashFinish} onComplete={handleSplashFinish} />
        ) : (
          <>
            {/* Render Active Page */}
            <main className="flex-1 w-full flex flex-col">
              {currentPage === 'login' && (
                <LoginPage
                  onSuccess={() => setCurrentPage('home')}
                  onLoginSuccess={() => setCurrentPage('home')}
                  onSkipToHome={() => setCurrentPage('home')}
                  onBack={() => setCurrentPage('home')}
                  onNavigate={handleNavigate}
                />
              )}

              {currentPage === 'home' && (
                <HomePage onNavigate={handleNavigate} />
              )}

              {currentPage === 'game' && (
                <GamePage onNavigate={handleNavigate} />
              )}

              {currentPage === 'result' && (
                <ResultPage onNavigate={handleNavigate} />
              )}

              {currentPage === 'wallet' && (
                <WalletPage onNavigate={handleNavigate} />
              )}

              {currentPage === 'recharge' && (
                <RechargePage onNavigate={handleNavigate} />
              )}

              {currentPage === 'withdraw' && (
                <WithdrawPage onNavigate={handleNavigate} />
              )}

              {currentPage === 'profile' && (
                <ProfilePage onNavigate={handleNavigate} onLogout={handleLogout} />
              )}

              {currentPage === 'invite' && (
                <InvitePage onNavigate={handleNavigate} />
              )}

              {currentPage === 'support' && (
                <CustomerServicePage onNavigate={handleNavigate} />
              )}

              {currentPage === 'settings' && (
                <SettingsPage onNavigate={handleNavigate} onLogout={handleLogout} />
              )}

              {currentPage === 'vip' && (
                <VipCenterPage onNavigate={handleNavigate} />
              )}

              {currentPage === 'tasks' && (
                <TaskCenterPage onNavigate={handleNavigate} />
              )}
            </main>

            {/* Global Win/Loss Celebration & Alert Modal */}
            <GlobalWinLossModal onNavigate={handleNavigate} />

            {/* Global Bottom Navigation Bar */}
            {showBottomNav && (
              <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <MainApp />
      </GameProvider>
    </AuthProvider>
  );
}
