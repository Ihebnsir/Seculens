import SeverityBadge from './SeverityBadge';

// Les trois catégories de la comparaison, dans l'ordre d'affichage.
// "Still open" reste replié : c'est l'information la moins nouvelle.
const SECTIONS = [
  { key: 'fixed', label: 'Fixed', icon: '✓', openWhenFilled: true },
  { key: 'new', label: 'New', icon: '+', openWhenFilled: true },
  { key: 'persisting', label: 'Still open', icon: '•', openWhenFilled: false }
];

// Sens de l'évolution du score, qui donne sa couleur au résumé.
function getScoreTrend(previousScore, currentScore) {
  if (currentScore > previousScore) return 'up';
  if (currentScore < previousScore) return 'down';
  return 'same';
}

// Une ligne compacte par finding : gravité, règle et titre (le détail complet reste dans FindingCard).
function ComparisonItem({ item }) {
  return (
    <li className="comparison-item">
      <SeverityBadge severity={item.severity} />
      <span className="comparison-rule">{item.ruleId}</span>
      <span className="comparison-title">{item.title}</span>
    </li>
  );
}

function ScanComparison({ comparison, onClose }) {
  const hasPrevious = Boolean(comparison?.hasPrevious);
  const lists = {
    fixed: comparison?.fixed || [],
    new: comparison?.new || [],
    persisting: comparison?.persisting || []
  };
  // Rien de corrigé ni de nouveau : aucun changement, même si des findings persistent.
  const hasChanges = lists.fixed.length > 0 || lists.new.length > 0;
  const hasFindings = hasChanges || lists.persisting.length > 0;
  const trend = hasPrevious ? getScoreTrend(comparison.previousScore, comparison.currentScore) : 'same';

  return (
    <section className="scan-comparison" aria-label="Comparison with previous scan">
      <div className="comparison-header">
        <h3 className="comparison-heading">Compared with previous scan</h3>
        <button type="button" className="comparison-close" onClick={onClose} aria-label="Close comparison">
          ×
        </button>
      </div>

      {!hasPrevious && (
        <p className="comparison-message">This is the first scan for this target - nothing to compare yet.</p>
      )}

      {hasPrevious && (
        <>
          <p className={`comparison-score score-trend-${trend}`}>
            Score: {comparison.previousScore} → {comparison.currentScore}
          </p>

          {!hasChanges && <p className="comparison-message">No changes detected since the last scan.</p>}

          {/* <details> natif, comme dans FindingCard : le navigateur gère l'ouverture et la fermeture. */}
          {hasFindings && SECTIONS.map((section) => {
            const items = lists[section.key];
            return (
              <details
                key={section.key}
                className={`comparison-section comparison-${section.key}`}
                open={section.openWhenFilled && items.length > 0}
              >
                <summary>
                  <span className="comparison-icon" aria-hidden="true">{section.icon}</span>
                  {section.label} ({items.length})
                </summary>
                {items.length > 0 ? (
                  <ul className="comparison-list">
                    {items.map((item, index) => (
                      <ComparisonItem key={item.findingId || `${item.ruleId}-${index}`} item={item} />
                    ))}
                  </ul>
                ) : (
                  <p className="comparison-empty">None.</p>
                )}
              </details>
            );
          })}
        </>
      )}
    </section>
  );
}

export default ScanComparison;
