import { useEffect, useState } from 'react';
import { deleteScan, getScans } from '../api/scansApi';
import { formatScanDate } from '../utils/date';
import { formatScannerVersion } from '../utils/scanner';
import { getScoreTone } from '../utils/score';
import BreakableUrl from './BreakableUrl';

function ScanHistory({ refreshKey, activeScanId, onSelectScan, onDeleteScan }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshScans = async () => {
    setLoading(true);
    setError('');

    try {
      const scanList = await getScans();
      setScans(scanList);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshScans();
  }, [refreshKey]);

  const handleDelete = async (scan) => {
    if (!window.confirm(`Delete the scan for ${scan.target}?`)) {
      return;
    }

    try {
      await deleteScan(scan.id);
      onDeleteScan(scan.id);
      await refreshScans();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="history-panel" aria-live="polite">
      <div className="history-header">
        <h2>Scan history</h2>
        {loading && <span>Loading...</span>}
      </div>

      {error && <p className="error-message">{error}</p>}
      {!loading && !error && scans.length === 0 && (
        <p className="empty-state-message history-empty">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 4.5h8l4 4v11H6v-15Z" />
            <path d="M14 4.5v4h4M9 13h6M9 16h6" />
          </svg>
          No scans yet
        </p>
      )}

      {scans.length > 0 && (
        <ul className="history-list">
          {scans.map((scan) => (
            // La liste utilise le format résumé, dont l'identifiant est id.
            <li
              className={`history-item${scan.id === activeScanId ? ' is-active' : ''}`}
              key={scan.id}
            >
              <button
                type="button"
                className="history-select"
                onClick={() => onSelectScan(scan.id)}
                aria-current={scan.id === activeScanId ? 'true' : undefined}
              >
                <strong><BreakableUrl url={scan.target} /></strong>
                <span className={`history-score ${getScoreTone(scan.score).className}`}>
                  {scan.score ?? 'N/A'}<span className="history-score-max">/100</span>
                </span>
                <span>{scan.findingsCount ?? 0} findings</span>
                <span>{formatScanDate(scan.createdAt)}</span>
                <span className="scanner-version">{formatScannerVersion(scan.scannerVersion)}</span>
              </button>
              {/* Bouton-icône de 44px : laisse la largeur de la colonne à l'URL du scan. */}
              <button
                type="button"
                className="danger-button icon-button"
                onClick={() => handleDelete(scan)}
                aria-label={`Delete scan for ${scan.target}`}
                title="Delete scan"
              >
                <svg className="button-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ScanHistory;