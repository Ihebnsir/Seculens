// Ordre de gravité, du plus grave au moins grave.
export const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

function severityRank(severity) {
  const rank = SEVERITY_ORDER.indexOf(severity);
  return rank === -1 ? SEVERITY_ORDER.length : rank;
}

// Tri d'affichage uniquement (les données ne changent pas) : d'abord les findings encore ouverts,
// du plus grave au moins grave, puis les findings corrigés, dans le même ordre.
// À gravité égale, l'ordre d'origine du scanner est conservé.
export function sortFindingsBySeverity(findings) {
  return (findings || [])
    .map((finding, index) => ({ finding, index }))
    .sort((a, b) =>
      Number(Boolean(a.finding.fixed)) - Number(Boolean(b.finding.fixed))
      || severityRank(a.finding.severity) - severityRank(b.finding.severity)
      || a.index - b.index)
    .map(({ finding }) => finding);
}

// Résumé pour l'en-tête des résultats : nombre de findings ouverts par gravité, et nombre de corrigés.
export function countFindings(findings) {
  const open = Object.fromEntries(SEVERITY_ORDER.map((severity) => [severity, 0]));
  let fixed = 0;

  (findings || []).forEach((finding) => {
    if (finding.fixed) {
      fixed += 1;
    } else if (finding.severity in open) {
      open[finding.severity] += 1;
    }
  });

  return { open, fixed };
}
