import ScoreCard from './ScoreCard';
import FindingCard from './FindingCard';

function ResultsPanel({ scan }) {
  if (!scan) {
    return (
      <section className="results-panel empty-state" aria-live="polite">
        <h2>Results</h2>
        <p>No scan yet</p>
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
          <span>Scanned: {new Date(scan.scannedAt).toLocaleString()}</span>
        </div>
      </div>

      <ScoreCard score={scan.score} />

      <div className="summary-box">
        <p>
          <strong>{findingsCount}</strong> findings detected across the target surface.
        </p>
      </div>

      <div className="findings-list">
        {scan.findings.map((finding) => (
          <FindingCard key={finding.ruleId} finding={finding} />
        ))}
      </div>
    </section>
  );
}

export default ResultsPanel;
