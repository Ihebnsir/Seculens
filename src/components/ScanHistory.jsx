import { useEffect, useRef, useState } from 'react';
import { deleteScan, getScans } from '../api/scansApi';
import { formatScanDate } from '../utils/date';
import { formatScannerVersion } from '../utils/scanner';
import { getScoreTone } from '../utils/score';
import BreakableUrl from './BreakableUrl';
import LensMark from './LensMark';

// Délai après lequel une demande de suppression sans réponse est annulée.
const CONFIRM_TIMEOUT_MS = 5000;

// Suppression en deux temps, dans la ligne elle-même : la corbeille laisse place à "Delete this scan? ✓ ✕".
// Un clic ailleurs, le focus qui quitte la confirmation, Échap ou 5 s sans réponse annulent la demande.
function DeleteControl({ target, onConfirm }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const containerRef = useRef(null);
  const trashRef = useRef(null);
  const cancelRef = useRef(null);
  // Vrai quand l'annulation vient du clavier ou du délai : le focus revient alors sur la corbeille.
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (!confirming) {
      if (restoreFocusRef.current) {
        restoreFocusRef.current = false;
        trashRef.current?.focus();
      }
      return undefined;
    }

    // Le focus va sur "✕" : deux appuis sur Entrée ne suppriment jamais un scan par accident.
    cancelRef.current?.focus();
    const timer = setTimeout(() => {
      restoreFocusRef.current = Boolean(containerRef.current?.contains(document.activeElement));
      setConfirming(false);
    }, CONFIRM_TIMEOUT_MS);
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setConfirming(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [confirming]);

  const cancel = () => {
    restoreFocusRef.current = true;
    setConfirming(false);
  };

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      // Bouton-icône de 44px : laisse la largeur de la colonne à l'URL du scan.
      <button
        type="button"
        ref={trashRef}
        className="danger-button icon-button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete scan for ${target}`}
        title="Delete scan"
      >
        <svg className="button-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5" />
        </svg>
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className="delete-confirm"
      role="group"
      aria-label={`Confirm deletion of the scan for ${target}`}
      onKeyDown={(event) => { if (event.key === 'Escape') cancel(); }}
      onBlur={(event) => { if (!containerRef.current?.contains(event.relatedTarget)) setConfirming(false); }}
    >
      <span className="delete-confirm-label">Delete this scan?</span>
      <span className="delete-confirm-actions">
        <button
          type="button"
          className="danger-button icon-button"
          onClick={handleConfirm}
          disabled={deleting}
          aria-label={`Yes, delete the scan for ${target}`}
          title="Delete"
        >
          <svg className="button-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </button>
        <button
          type="button"
          ref={cancelRef}
          className="secondary-button icon-button"
          onClick={cancel}
          aria-label="Cancel"
          title="Keep this scan"
        >
          <svg className="button-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
          </svg>
        </button>
      </span>
    </div>
  );
}

function ScanHistory({ refreshKey, activeScanId, activeScanScore, onSelectScan, onDeleteScan }) {
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

  // Appelé une fois la suppression confirmée dans la ligne (voir DeleteControl).
  const handleDelete = async (scan) => {
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
        <div className="empty-state-body history-empty">
          <LensMark className="empty-state-mark" muted />
          <p className="empty-state-title">No scans yet</p>
          <p className="empty-state-hint">Scans you run will appear here.</p>
        </div>
      )}

      {scans.length > 0 && (
        <ul className="history-list">
          {scans.map((scan) => {
            // Le scan ouvert affiche le score du panneau Results, recalculé dès qu'un finding est coché "Fixed" :
            // la liste n'a pas besoin d'être rechargée pour rester à jour.
            const score = scan.id === activeScanId && activeScanScore !== undefined ? activeScanScore : scan.score;
            return (
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
                  <span className={`history-score ${getScoreTone(score).className}`}>
                    {score ?? 'N/A'}<span className="history-score-max">/100</span>
                  </span>
                  <span>{scan.findingsCount ?? 0} findings</span>
                  <span>{formatScanDate(scan.createdAt)}</span>
                  <span className="scanner-version">{formatScannerVersion(scan.scannerVersion)}</span>
                </button>
                <DeleteControl target={scan.target} onConfirm={() => handleDelete(scan)} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default ScanHistory;