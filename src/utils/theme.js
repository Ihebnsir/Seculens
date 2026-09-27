// Gestion du thème clair/sombre : l'attribut data-theme posé sur <html> active
// les variables CSS correspondantes définies dans index.css.
const THEME_STORAGE_KEY = 'seculens_theme';

// Thème de départ : le choix sauvegardé, sinon la préférence du système, sinon sombre.
export function getInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
  } catch (error) {
    // localStorage peut être bloqué (navigation privée) : on passe à la préférence système.
  }

  // matchMedia n'existe pas dans certains environnements (tests) : on garde alors le sombre.
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// Appelé uniquement quand l'utilisateur clique : le choix est mémorisé après un F5.
export function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Sans localStorage, le thème reste actif jusqu'au rechargement de la page.
  }
}
