import { useState } from 'react';
import SeverityBadge from './SeverityBadge';
import AiInsight from './AiInsight';
import { SEVERITY_ORDER } from '../utils/severity';

// Gravités dont les détails sont dépliés à l'affichage ; low et info restent repliés.
const OPEN_BY_DEFAULT = ['critical', 'high', 'medium'];

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

function FindingCard({ finding, onSetFixed, appearIndex = 0 }) {
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

  // La classe de gravité colore la bande à gauche de la carte.
  const severityClass = SEVERITY_ORDER.includes(finding.severity) ? finding.severity : 'info';

  return (
    <article
      className={`finding-card finding-${severityClass}${finding.fixed ? ' finding-fixed' : ''}`}
      style={{ '--appear-index': appearIndex }}
    >
      {/* Niveau 1, toujours visible : gravité, titre et description sur une ligne. */}
      <div className="finding-header">
        <div className="finding-title-line">
          <SeverityBadge severity={finding.severity} />
          {/* L'étiquette suit le texte du titre : elle passe à la ligne avec lui sur mobile. */}
          <h3>
            {finding.title}
            {finding.fixed && <span className="fixed-tag">Fixed</span>}
          </h3>
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
      </div>
      {error && <p className="error-message">{error}</p>}

      <p className="finding-description">{finding.description}</p>

      {/* Niveau 2 : élément <details> natif, ouvert et fermé par le navigateur sans JavaScript.
          Ouvert d'office pour critical, high et medium tant que le finding n'est pas corrigé. */}
      <details className="finding-details" open={OPEN_BY_DEFAULT.includes(severityClass) && !finding.fixed}>
        <summary>
          <span className="details-closed-label">Show details</span>
          <span className="details-open-label">Hide details</span>
        </summary>

        <div className="finding-details-body">
          <p className="finding-meta">
            <span className="finding-rule">{finding.ruleId}</span>
            <span className="finding-cwe">{finding.cwe}</span>
            <span>Confidence: {finding.confidence}</span>
          </p>

          <AiInsight explanation={finding.aiExplanation} />

          <div className="remediation-box">
            <p className="remediation-title">Remediation</p>
            <p className="finding-remediation">{finding.remediation}</p>
          </div>

          {evidenceEntries.length > 0 && (
            <div className="evidence-box">
              <p className="evidence-title">Raw evidence</p>
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
        </div>
      </details>
    </article>
  );
}

export default FindingCard;
