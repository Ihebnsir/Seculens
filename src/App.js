import { useEffect, useRef, useState } from 'react';
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
import { createScan, getAiStatus, getScan, setFindingFixed, UNAUTHORIZED_EVENT } from './api/scansApi';
import { getEmailVerificationToken, getResetPasswordToken } from './utils/url';

// Polling des explications IA : une vérification toutes les 3 s, 20 au maximum (60 s).
// 60 s laissent le temps au backend de réessayer puis de basculer sur le modèle de secours.
const AI_POLL_INTERVAL_MS = 3000;
const AI_POLL_MAX_ATTEMPTS = 20;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

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
  const [aiLoading, setAiLoading] = useState(false);
  // Numéro du polling en cours : l'incrémenter annule le polling précédent
  // (nouveau scan, autre scan ouvert, scan supprimé, composant démonté).
  const aiPollIdRef = useRef(0);

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  // Au démontage ou à la déconnexion, on annule le polling pour ne jamais mettre à jour un écran disparu.
  useEffect(() => () => {
    aiPollIdRef.current += 1;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      aiPollIdRef.current += 1;
      setAiLoading(false);
    }
  }, [isAuthenticated]);

  const stopAiPolling = () => {
    aiPollIdRef.current += 1;
    setAiLoading(false);
  };

  // Attend que le backend ait fini les explications IA, puis recharge le scan complet.
  // Toute erreur est absorbée : au pire, le scan reste affiché sans explications.
  const pollAiExplanations = async (scanId) => {
    const pollId = aiPollIdRef.current + 1;
    aiPollIdRef.current = pollId;
    const isCurrentPoll = () => aiPollIdRef.current === pollId;
    setAiLoading(true);

    for (let attempt = 1; attempt <= AI_POLL_MAX_ATTEMPTS; attempt += 1) {
      await wait(AI_POLL_INTERVAL_MS);
      if (!isCurrentPoll()) return;

      try {
        const aiStatus = await getAiStatus(scanId);
        if (aiStatus?.ready) break;
      } catch (requestError) {
        // Session expirée, accès refusé ou scan supprimé : inutile de continuer.
        if ([401, 403, 404].includes(requestError.status)) {
          if (isCurrentPoll()) setAiLoading(false);
          return;
        }
        // Serveur momentanément injoignable : on réessaie à la tentative suivante.
      }
    }

    if (!isCurrentPoll()) return;

    try {
      const updatedScan = await getScan(scanId);
      if (isCurrentPoll()) setScanResult(updatedScan);
    } catch (requestError) {
      // Rechargement impossible : on garde le scan déjà affiché, sans message inquiétant.
    } finally {
      if (isCurrentPoll()) setAiLoading(false);
    }
  };

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
    stopAiPolling();

    try {
      const scan = await createScan(cleanedUrl);
      setScanResult(scan);
      setStatus('results');
      setHistoryRefreshKey((key) => key + 1);

      // Les explications IA arrivent plus tard : on les attend seulement s'il y a des findings sans explication.
      const needsAi = scan?.findings?.some((finding) => !finding.aiExplanation);
      if (scan?._id && needsAi) {
        pollAiExplanations(scan._id);
      }
    } catch (requestError) {
      setError(requestError.message);
      setStatus('error');
    }
  };

  // Scan ouvert depuis l'historique : pas de polling, l'IA a déjà terminé depuis longtemps.
  const handleSelectScan = async (scanId) => {
    setError('');
    setStatus('loading');
    stopAiPolling();

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
      stopAiPolling();
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
          <span className="account-email" title={user?.email}>{user?.email}</span>
          <ThemeToggle />
          <button type="button" className="secondary-button" onClick={logout}>
            Log out
            <span className="logout-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </header>

      {/* Colonne principale (formulaire + résultats) puis historique : sur mobile, l'ordre du code
          fait passer les résultats avant l'historique ; sur ordinateur, l'historique passe à droite. */}
      <main className="app-main">
        <div className="workspace-main">
          <ScanForm
            targetUrl={targetUrl}
            onUrlChange={setTargetUrl}
            onSubmit={handleStartScan}
            error={error}
            loading={status === 'loading'}
          />

          {status === 'loading' && <p className="loading-message">Loading scan...</p>}
          <ResultsPanel scan={scanResult} aiLoading={aiLoading} onSetFindingFixed={handleSetFindingFixed} />
        </div>

        <aside className="workspace-side">
          <ScanHistory
            refreshKey={historyRefreshKey}
            activeScanId={scanResult?._id}
            onSelectScan={handleSelectScan}
            onDeleteScan={handleDeleteScan}
          />
        </aside>
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
