import { useEffect, useState } from 'react';
import './App.css';
import ScanForm from './components/ScanForm';
import ResultsPanel from './components/ResultsPanel';
import ScanHistory from './components/ScanHistory';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import ResetPasswordForm from './components/ResetPasswordForm';
import EmailVerificationForm from './components/EmailVerificationForm';
import ThemeToggle from './components/ThemeToggle';
import { AuthProvider, useAuth } from './context/AuthContext';
import { createScan, getScan, setFindingFixed, UNAUTHORIZED_EVENT } from './api/scansApi';
import { getEmailVerificationToken, getResetPasswordToken } from './utils/url';

function AppContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const emailVerificationToken = getEmailVerificationToken(window.location.pathname);
  const resetToken = getResetPasswordToken(window.location.pathname);
  const [targetUrl, setTargetUrl] = useState('');
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState('idle');
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  const handleStartScan = async () => {
    const cleanedUrl = targetUrl.trim();

    if (!cleanedUrl) {
      setError('Please enter a URL before starting the scan.');
      return;
    }

    if (!/^https?:\/\//i.test(cleanedUrl)) {
      setError('The URL must start with http:// or https://');
      return;
    }

    setError('');
    setStatus('loading');

    try {
      const scan = await createScan(cleanedUrl);
      setScanResult(scan);
      setStatus('results');
      setHistoryRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message);
      setStatus('error');
    }
  };

  const handleSelectScan = async (scanId) => {
    setError('');
    setStatus('loading');

    try {
      const scan = await getScan(scanId);
      setScanResult(scan);
      setStatus('results');
    } catch (requestError) {
      setError(requestError.message);
      setStatus('error');
    }
  };

  const handleSetFindingFixed = async (findingId, fixed) => {
    // Les appels API utilisent les identifiants MongoDB, nommés _id.
    const scanId = scanResult?._id;
    if (!scanId) {
      throw new Error('Identifiant du scan manquant.');
    }

    const updatedScan = await setFindingFixed(scanId, findingId, fixed);
    if (updatedScan?._id) {
      setScanResult(updatedScan);
    } else {
      setScanResult((currentScan) => ({
        ...currentScan,
        findings: currentScan.findings.map((finding) =>
          finding._id === findingId ? { ...finding, fixed } : finding
        )
      }));
    }
  };

  const handleDeleteScan = (scanId) => {
    if (scanResult?._id === scanId) {
      setScanResult(null);
      setStatus('idle');
    }
  };

  if (emailVerificationToken) {
    return (
      <div className="app-shell auth-shell">
        <header className="app-header auth-brand">
          <div className="brand-lockup">
            <h1>SecuLens</h1>
            <p>Web Security Assessment Platform</p>
          </div>
          <ThemeToggle />
        </header>
        <main className="auth-layout">
          <div className="auth-identity">
            <span className="eyebrow">SECULENS / ACCESS</span>
            <h2>Security insights, in focus.</h2>
          </div>
          <EmailVerificationForm token={emailVerificationToken} />
        </main>
      </div>
    );
  }

  if (resetToken) {
    const recoveryForm = authMode === 'forgot' ? (
      <ForgotPasswordForm onSwitchToLogin={() => { window.location.href = '/'; }} />
    ) : (
      <ResetPasswordForm token={resetToken} onRequestNewLink={() => setAuthMode('forgot')} />
    );

    return (
      <div className="app-shell auth-shell">
        <header className="app-header auth-brand">
          <div className="brand-lockup">
            <h1>SecuLens</h1>
            <p>Web Security Assessment Platform</p>
          </div>
          <ThemeToggle />
        </header>
        <main className="auth-layout">
          <div className="auth-identity">
            <span className="eyebrow">SECULENS / ACCESS</span>
            <h2>Security insights, in focus.</h2>
          </div>
          {recoveryForm}
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app-shell auth-shell">
        <header className="app-header auth-brand">
          <div className="brand-lockup">
            <h1>SecuLens</h1>
            <p>Web Security Assessment Platform</p>
          </div>
          <ThemeToggle />
        </header>
        <main className="auth-layout">
          <div className="auth-identity">
            <span className="eyebrow">SECULENS / ACCESS</span>
            <h2>Security insights, in focus.</h2>
          </div>
          {authMode === 'login' ? (
            <LoginForm
              onSwitchToRegister={() => setAuthMode('register')}
              onSwitchToForgotPassword={() => setAuthMode('forgot')}
            />
          ) : authMode === 'register' ? (
            <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
          ) : (
            <ForgotPasswordForm onSwitchToLogin={() => setAuthMode('login')} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <h1>SecuLens</h1>
          <p>Web Security Assessment Platform</p>
        </div>
        <div className="account-bar">
          <span className="user-avatar" aria-hidden="true">
            {user?.email?.trim()?.charAt(0)?.toUpperCase() || '?'}
          </span>
          <span className="account-email">{user?.email}</span>
          <ThemeToggle />
          <button type="button" className="secondary-button" onClick={logout}>
            Log out
            <span className="logout-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <ScanForm
          targetUrl={targetUrl}
          onUrlChange={setTargetUrl}
          onSubmit={handleStartScan}
          error={error}
          loading={status === 'loading'}
        />

        <ScanHistory
          refreshKey={historyRefreshKey}
          onSelectScan={handleSelectScan}
          onDeleteScan={handleDeleteScan}
        />

        {status === 'loading' && <p className="loading-message">Loading scan...</p>}
        <ResultsPanel scan={scanResult} onSetFindingFixed={handleSetFindingFixed} />
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
