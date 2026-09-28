import ScoreCard from './ScoreCard';
import FindingCard from './FindingCard';
import { formatScanDate } from '../utils/date';
import { formatScannerVersion } from '../utils/scanner';
import { sortFindingsBySeverity } from '../utils/severity';
import BreakableUrl from './BreakableUrl';
import LensMark from './LensMark';

function ResultsPanel({ scan, aiLoading, onSetFindingFixed }) {
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
    <section className="results-panel" aria-live="polite">
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
      <ScoreCard score={scan.score} findings={scan.findings} />

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
        {sortedFindings.map((finding) => (
          <FindingCard
            key={finding._id}
            finding={finding}
            onSetFixed={onSetFindingFixed}
          />
        ))}
      </div>
    </section>
  );
}

export default ResultsPanel;
