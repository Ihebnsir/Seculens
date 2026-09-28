import BrandLockup from './BrandLockup';
import LensMark from './LensMark';
import ThemeToggle from './ThemeToggle';

// Mise en page commune aux écrans d'authentification (connexion, inscription, mot de passe,
// vérification d'email) : en-tête avec le logo, grand réticule et accroche à gauche, formulaire à droite.
function AuthLayout({ children }) {
  return (
    <div className="app-shell auth-shell">
      <header className="app-header auth-brand">
        <BrandLockup />
        <ThemeToggle />
      </header>
      <main className="auth-layout">
        <div className="auth-identity">
          <LensMark className="auth-lens" />
          <span className="eyebrow">SECULENS / ACCESS</span>
          <h2>Security insights, in focus.</h2>
        </div>
        {children}
      </main>
    </div>
  );
}

export default AuthLayout;
