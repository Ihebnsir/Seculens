import SeverityBadge from './SeverityBadge';

function FindingCard({ finding }) {
  return (
    <article className="finding-card">
      <div className="finding-header">
        <div>
          <p className="finding-rule">{finding.ruleId}</p>
          <h3>{finding.title}</h3>
        </div>
        <SeverityBadge severity={finding.severity} />
      </div>

      <div className="finding-meta">
        <span>Confidence: {finding.confidence}</span>
        <span>{finding.cwe}</span>
      </div>

      <div className="evidence-box">
        <p className="evidence-title">Evidence</p>
        <ul>
          {finding.evidence?.header && <li>Header: {finding.evidence.header}</li>}
          {finding.evidence?.parameter && <li>Parameter: {finding.evidence.parameter}</li>}
          {finding.evidence?.note && <li>Note: {finding.evidence.note}</li>}
          <li>Present: {finding.evidence?.present ? 'Yes' : 'No'}</li>
        </ul>
      </div>

      <p className="finding-description">{finding.description}</p>
      <p className="finding-remediation">
        <strong>Remediation:</strong> {finding.remediation}
      </p>
    </article>
  );
}

export default FindingCard;
