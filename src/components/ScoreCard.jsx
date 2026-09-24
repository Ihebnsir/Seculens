function ScoreCard({ score }) {
  const getTone = (value) => {
    if (value >= 80) return 'score-good';
    if (value >= 60) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="score-card">
      <div>
        <p className="score-label">Security score</p>
        <div className={`score-value ${getTone(score)}`}>{score}/100</div>
      </div>
    </div>
  );
}

export default ScoreCard;
