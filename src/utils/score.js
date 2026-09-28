// Seuils du score, partagés par la jauge des résultats et l'historique.
export function getScoreTone(score) {
  if (score >= 80) return { className: 'score-good', verdict: 'Solid' };
  if (score >= 60) return { className: 'score-medium', verdict: 'Needs attention' };
  return { className: 'score-low', verdict: 'At risk' };
}
