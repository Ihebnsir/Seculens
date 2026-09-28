import { useEffect, useRef, useState } from 'react';
import { countFindings, SEVERITY_ORDER } from '../utils/severity';
import { getScoreTone } from '../utils/score';

// Graduation de la "bague" de la lentille : un trait tous les 5 points, plus long tous les 25.
const TICKS = Array.from({ length: 20 }, (_, index) => {
  const angle = (index / 20) * 2 * Math.PI - Math.PI / 2;
  const isMajor = index % 5 === 0;
  const inner = isMajor ? 55 : 57;
  return {
    x1: 60 + inner * Math.cos(angle),
    y1: 60 + inner * Math.sin(angle),
    x2: 60 + 60 * Math.cos(angle),
    y2: 60 + 60 * Math.sin(angle),
    isMajor
  };
});

function ScoreGauge({ score, toneClass }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));

  return (
    <div className={`score-gauge ${toneClass}`} role="img" aria-label={`Security score ${value} out of 100`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        {TICKS.map((tick, index) => (
          <line
            key={index}
            className={tick.isMajor ? 'gauge-tick gauge-tick-major' : 'gauge-tick'}
            x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
          />
        ))}
        <circle className="gauge-track" cx="60" cy="60" r="45" />
        {/* pathLength=100 : la longueur de l'arc correspond directement au score. */}
        <circle
          className="gauge-arc"
          cx="60" cy="60" r="45"
          pathLength="100"
          strokeDasharray={`${value} 100`}
          strokeLinecap={value > 0 ? 'round' : 'butt'}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className="gauge-value">
        <span className="score-value">{value}</span>
        <span className="gauge-max">/100</span>
      </span>
    </div>
  );
}

function ScoreCard({ score, findings }) {
  const tone = getScoreTone(score);
  const { open, fixed } = countFindings(findings);
  const openSeverities = SEVERITY_ORDER.filter((severity) => open[severity] > 0);

  // Flash discret quand le score change (finding coché ou décoché "Fixed"). Chaque changement donne
  // une nouvelle clé à l'overlay, ce qui rejoue son animation. Le parent remonte la carte quand on change
  // de scan (key), donc ouvrir un autre scan ne déclenche pas de flash.
  const [flashCount, setFlashCount] = useState(0);
  const previousScore = useRef(score);

  useEffect(() => {
    if (previousScore.current !== score) {
      previousScore.current = score;
      setFlashCount((count) => count + 1);
    }
  }, [score]);

  return (
    <div className="score-card">
      {flashCount > 0 && <span key={flashCount} className="score-flash" aria-hidden="true" />}
      <ScoreGauge score={score} toneClass={tone.className} />

      <div className="score-summary">
        <p className="score-label">Security score</p>
        <p className={`score-verdict ${tone.className}`}>{tone.verdict}</p>

        <ul className="severity-breakdown" aria-label="Open findings by severity">
          {openSeverities.map((severity) => (
            <li key={severity} className={`breakdown-chip breakdown-${severity}`}>
              <span className="breakdown-count">{open[severity]}</span> {severity}
            </li>
          ))}
          {fixed > 0 && (
            <li className="breakdown-chip breakdown-fixed">
              <span className="breakdown-count">{fixed}</span> fixed
            </li>
          )}
          {!openSeverities.length && !fixed && <li className="breakdown-chip breakdown-none">No findings</li>}
        </ul>

        <p className="score-hint">The score only counts findings that are still open.</p>
      </div>
    </div>
  );
}

export default ScoreCard;
