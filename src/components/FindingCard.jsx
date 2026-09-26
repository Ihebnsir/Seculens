import { useState } from 'react';
import SeverityBadge from './SeverityBadge';

function FindingCard({ finding, onSetFixed }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleFixedChange = async (event) => {
    const fixed = event.target.checked;
    setSaving(true);
    setError('');

    try {
      // Chaque finding est identifié par son _id MongoDB.
      if (!finding._id) {
        throw new Error('Identifiant du finding manquant.');
      }
      await onSetFixed(finding._id, fixed);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className={`finding-card${finding.fixed ? ' finding-fixed' : ''}`}>
      <div className="finding-header">
        <div>
          <p className="finding-rule">{finding.ruleId}</p>
          <h3>{finding.title}</h3>
        </div>
        <SeverityBadge severity={finding.severity} />
      </div>

      <label className="fixed-control">
        <input
          type="checkbox"
          checked={Boolean(finding.fixed)}
          onChange={handleFixedChange}
          disabled={saving}
        />
        Mark as fixed
      </label>
      {error && <p className="error-message">{error}</p>}

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
