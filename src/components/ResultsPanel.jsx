import ScoreCard from './ScoreCard';
import FindingCard from './FindingCard';
import { formatScanDate } from '../utils/date';

function ResultsPanel({ scan, aiLoading, onSetFindingFixed }) {
  if (!scan) {
    return (
      <section className="results-panel empty-state" aria-live="polite">
        <h2>Results</h2>
        <p className="empty-state-message">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1.5v3M22.5 12h-3M12 22.5v-3M1.5 12h3" />
          </svg>
          No scan yet
        </p>
      </section>
    );
  }

  const findingsCount = scan.findings?.length || 0;

  return (
    <section className="results-panel" aria-live="polite">
      <div className="results-header">
        <div>
          <h2>Results</h2>
          <p className="scan-target">Target: {scan.target}</p>
        </div>
        <div className="scan-meta">
          <span>Status: {scan.status}</span>
          <span>Scanned: {formatScanDate(scan.createdAt)}</span>
        </div>
      </div>

      {/* Message discret : les findings restent visibles et utilisables pendant l'analyse IA. */}
      {aiLoading && (
        <p className="ai-loading" role="status">
          <span className="ai-spinner" aria-hidden="true" />
          AI is analyzing these findings...
        </p>
      )}

      <ScoreCard score={scan.score} />

      <div className="summary-box">
        <p>
          <strong>{findingsCount}</strong> findings detected across the target surface.
        </p>
      </div>

      <div className="findings-list">
        {scan.findings.map((finding) => (
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
