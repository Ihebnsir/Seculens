import { useState } from 'react';
import { applyTheme, saveTheme } from '../utils/theme';

// Le bouton montre le thème vers lequel on va basculer :
// un soleil en mode sombre ("passer au clair"), une lune en mode clair ("passer au sombre").
function ThemeToggle() {
  // Le thème a déjà été appliqué sur <html> au démarrage (index.js) : on le relit ici.
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const label = nextTheme === 'light' ? 'Switch to light theme' : 'Switch to dark theme';

  const handleToggle = () => {
    applyTheme(nextTheme);
    saveTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      className="secondary-button theme-toggle"
      onClick={handleToggle}
      aria-label={label}
      title={label}
    >
      {nextTheme === 'light' ? (
        <svg className="theme-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </svg>
      ) : (
        <svg className="theme-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}

export default ThemeToggle;
