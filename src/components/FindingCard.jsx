import { useState } from 'react';
import SeverityBadge from './SeverityBadge';
import AiInsight from './AiInsight';

// Transforme une clé technique en libellé lisible : "setCookieCount" devient "Set cookie count".
function formatEvidenceKey(key) {
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Affiche n'importe quelle valeur de preuve sous forme de texte, sans la tronquer.
function formatEvidenceValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.map(formatEvidenceValue).join(', ') : '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

// Le scanner envoie une preuve différente selon la règle : on liste toutes les clés reçues,
// sans supposer lesquelles existent. Une preuve qui n'est pas un objet est affichée telle quelle.
function getEvidenceEntries(evidence) {
  if (evidence === null || evidence === undefined) return [];
  if (typeof evidence !== 'object' || Array.isArray(evidence)) return [['value', evidence]];
  return Object.entries(evidence);
}

function FindingCard({ finding, onSetFixed }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const evidenceEntries = getEvidenceEntries(finding.evidence);

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
        <span className="finding-cwe">{finding.cwe}</span>
      </div>

      {evidenceEntries.length > 0 && (
        <div className="evidence-box">
          <p className="evidence-title">Evidence</p>
          <dl className="evidence-list">
            {evidenceEntries.map(([key, value]) => (
              <div className="evidence-row" key={key}>
                <dt>{formatEvidenceKey(key)}</dt>
                <dd>{formatEvidenceValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <AiInsight explanation={finding.aiExplanation} />

      <p className="finding-description">{finding.description}</p>
      <p className="finding-remediation">
        <strong>Remediation:</strong> {finding.remediation}
      </p>
    </article>
  );
}

export default FindingCard;
