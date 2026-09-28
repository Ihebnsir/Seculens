import { useEffect, useState } from 'react';
import ScoreCard from './ScoreCard';
import FindingCard from './FindingCard';
import { formatScanDate } from '../utils/date';
import { formatScannerVersion } from '../utils/scanner';
import { sortFindingsBySeverity } from '../utils/severity';
import BreakableUrl from './BreakableUrl';
import LensMark from './LensMark';

// Apparition en cascade : chaque élément démarre 50 ms après le précédent, plafonné pour ne jamais faire attendre.
const CASCADE_MAX_INDEX = 8;
const CASCADE_DURATION_MS = 900;

function ResultsPanel({ scan, aiLoading, onSetFindingFixed }) {
  // La cascade ne joue qu'à l'ouverture d'un scan. Ensuite la classe est retirée : une carte déplacée
  // par le tri (après "Mark as fixed") ou un rechargement des explications IA ne rejoue pas l'animation.
  const scanId = scan?._id;
  const [settledScanId, setSettledScanId] = useState(null);
  const isAppearing = Boolean(scanId) && scanId !== settledScanId;

  useEffect(() => {
    if (!scanId) return undefined;
    const timer = setTimeout(() => setSettledScanId(scanId), CASCADE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [scanId]);

  if (!scan) {
    return (
      <section className="results-panel empty-state" aria-live="polite">
        <h2>Results</h2>
        <div className="empty-state-body">
          <LensMark className="empty-state-mark" muted />
          <p className="empty-state-title">No scan yet</p>
          <p className="empty-state-hint">Enter a target URL above to run your first scan.</p>
        </div>
      </section>
    );
  }

  // Affichage seulement : les findings les plus graves (et encore ouverts) passent en premier.
  const sortedFindings = sortFindingsBySeverity(scan.findings);

  return (
    <section className={`results-panel${isAppearing ? ' is-appearing' : ''}`} aria-live="polite">
      {/* 1. De quoi parle-t-on : la cible et le contexte du scan. */}
      <div className="results-header">
        <h2>Results</h2>
        <div className="scan-meta">
          <span>HTTP {scan.status}</span>
          <span>{formatScanDate(scan.createdAt)}</span>
          <span className="scanner-version">{formatScannerVersion(scan.scannerVersion)}</span>
        </div>
      </div>
      <p className="scan-target"><BreakableUrl url={scan.target} /></p>

      {/* 2. Le verdict : score et répartition par gravité. */}
      {/* key : un autre scan remonte la carte, donc pas de flash du score en changeant de scan. */}
      <ScoreCard key={scan._id} score={scan.score} findings={scan.findings} />

      {/* Message discret : les findings restent visibles et utilisables pendant l'analyse IA. */}
      {aiLoading && (
        <p className="ai-loading" role="status">
          <span className="ai-spinner" aria-hidden="true" />
          AI is analyzing these findings...
        </p>
      )}

      {/* 3. Le détail, du plus grave au moins grave. */}
      <h3 className="findings-heading">
        Findings <span className="findings-count">{sortedFindings.length}</span>
      </h3>
      <div className="findings-list">
        {sortedFindings.map((finding, index) => (
          <FindingCard
            key={finding._id}
            finding={finding}
            appearIndex={Math.min(index + 1, CASCADE_MAX_INDEX)}
            onSetFixed={onSetFindingFixed}
          />
        ))}
      </div>
    </section>
  );
}

export default ResultsPanel;
