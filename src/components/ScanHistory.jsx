import { useEffect, useState } from 'react';
import { deleteScan, getScans } from '../api/scansApi';

function formatScanDate(dateValue) {
  // Le backend stocke la date du scan dans createdAt.
  if (!dateValue) {
    return 'Date indisponible';
  }

  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? 'Date indisponible' : date.toLocaleString();
}

function ScanHistory({ refreshKey, onSelectScan, onDeleteScan }) {
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
            <li className="history-item" key={scan.id}>
              <button
                type="button"
                className="history-select"
                onClick={() => onSelectScan(scan.id)}
              >
                <strong>{scan.target}</strong>
                <span>Score: {scan.score ?? 'N/A'}</span>
                <span>{formatScanDate(scan.createdAt)}</span>
                <span>{scan.findingsCount ?? 0} findings</span>
              </button>
              <button
                type="button"
                className="history-delete"
                onClick={() => handleDelete(scan)}
                aria-label={`Delete scan for ${scan.target}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ScanHistory;