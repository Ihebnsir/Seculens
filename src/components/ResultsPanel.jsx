import { useEffect, useState } from 'react';
import ScoreCard from './ScoreCard';
import FindingCard from './FindingCard';
import { formatScanDate } from '../utils/date';
import { formatScannerVersion } from '../utils/scanner';
import { sortFindingsBySeverity } from '../utils/severity';
import BreakableUrl from './BreakableUrl';
import LensMark from './LensMark';
import { downloadScanReport } from '../utils/pdfReport';
import { compareWithPrevious } from '../api/scansApi';
import ScanComparison from './ScanComparison';

// Apparition en cascade : chaque élément démarre 50 ms après le précédent, plafonné pour ne jamais faire attendre.
const CASCADE_MAX_INDEX = 8;
const CASCADE_DURATION_MS = 900;

function ResultsPanel({ scan, aiLoading, onSetFindingFixed }) {
  // La cascade ne joue qu'à l'ouverture d'un scan. Ensuite la classe est retirée : une carte déplacée
  // par le tri (après "Mark as fixed") ou un rechargement des explications IA ne rejoue pas l'animation.
  const scanId = scan?._id;
  const [settledScanId, setSettledScanId] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');
  // Comparaison avec le scan précédent : null tant que l'utilisateur ne l'a pas demandée.
  const [comparison, setComparison] = useState(null);
  const [compareBusy, setCompareBusy] = useState(false);
  const [compareError, setCompareError] = useState('');
  const isAppearing = Boolean(scanId) && scanId !== settledScanId;

  useEffect(() => {
    if (!scanId) return undefined;
    const timer = setTimeout(() => setSettledScanId(scanId), CASCADE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [scanId]);

  // Un autre scan est affiché : l'ancienne comparaison ne le concerne plus.
  useEffect(() => {
    setComparison(null);
    setCompareError('');
  }, [scanId]);

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

  // Génère le rapport PDF dans le navigateur ; le bouton reste désactivé le temps de la génération.
  const handleDownloadPdf = async () => {
    setPdfBusy(true);
    setPdfError('');
    try {
      await downloadScanReport(scan);
    } catch {
      setPdfError('The PDF report could not be generated. Please try again.');
    } finally {
      setPdfBusy(false);
    }
  };

  // La comparaison ne dépend que des findings, enregistrés dès la création du scan :
  // elle n'a pas besoin d'attendre la fin de l'analyse IA.
  const handleCompare = async () => {
    setCompareBusy(true);
    setCompareError('');
    try {
      setComparison(await compareWithPrevious(scanId));
    } catch (requestError) {
      setComparison(null);
      setCompareError(requestError.message);
    } finally {
      setCompareBusy(false);
    }
  };

  const regression = scan.scoreRegression;

  // Affichage seulement : les findings les plus graves (et encore ouverts) passent en premier.
  const sortedFindings = sortFindingsBySeverity(scan.findings);

  return (
    <section className={`results-panel${isAppearing ? ' is-appearing' : ''}`} aria-live="polite">
      {/* 1. De quoi parle-t-on : la cible et le contexte du scan. */}
      <div className="results-header">
        <div className="results-title">
          <h2>Results</h2>
          <button type="button" className="secondary-button pdf-button" onClick={handleDownloadPdf} disabled={pdfBusy}>
            {pdfBusy ? 'Generating PDF...' : 'Download PDF'}
          </button>
          {/* Sans _id, le scan n'est pas encore enregistré : il n'y a rien à comparer côté serveur. */}
          {scanId && (
            <button type="button" className="secondary-button pdf-button" onClick={handleCompare} disabled={compareBusy}>
              {compareBusy ? 'Comparing...' : 'Compare with previous scan'}
            </button>
          )}
        </div>
        <div className="scan-meta">
          <span>HTTP {scan.status}</span>
          <span>{formatScanDate(scan.createdAt)}</span>
          <span className="scanner-version">{formatScannerVersion(scan.scannerVersion)}</span>
        </div>
      </div>
      <p className="scan-target"><BreakableUrl url={scan.target} /></p>
      {pdfError && <p className="error-message" role="alert">{pdfError}</p>}

      {/* Alerte factuelle : le backend ne l'envoie que si le score a baissé d'au moins 15 points. */}
      {regression && (
        <p className="score-regression" role="status">
          <span className="score-regression-icon" aria-hidden="true">▼</span>
          <span>
            Security score dropped by <strong>{regression.drop} points</strong> since the last scan{' '}
            <span className="score-regression-values">({regression.previousScore} → {scan.score})</span>
          </span>
        </p>
      )}

      {/* 2. Le verdict : score et répartition par gravité. */}
      {/* key : un autre scan remonte la carte, donc pas de flash du score en changeant de scan. */}
      <ScoreCard key={scan._id} score={scan.score} findings={scan.findings} />

      {compareError && <p className="error-message" role="alert">{compareError}</p>}
      {comparison && <ScanComparison comparison={comparison} onClose={() => setComparison(null)} />}

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
        {sortedFindings.map((finding, index) => (
          <FindingCard
            key={finding._id}
            finding={finding}
            appearIndex={Math.min(index + 1, CASCADE_MAX_INDEX)}
            onSetFixed={onSetFindingFixed}
          />
        ))}
      </div>
    </section>
  );
}

export default ResultsPanel;
