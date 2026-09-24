const severityStyles = {
  critical: 'severity-critical',
  high: 'severity-high',
  medium: 'severity-medium',
  low: 'severity-low',
  info: 'severity-info'
};

function SeverityBadge({ severity }) {
  const label = severity ? severity.toUpperCase() : 'INFO';

  return <span className={`severity-badge ${severityStyles[severity] || 'severity-info'}`}>{label}</span>;
}

export default SeverityBadge;
