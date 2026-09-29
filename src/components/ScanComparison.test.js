import { fireEvent, render, screen, within } from '@testing-library/react';
import ScanComparison from './ScanComparison';

const item = (findingId, ruleId, title, severity) => ({ findingId, ruleId, title, severity, evidence: {} });

const comparison = {
  hasPrevious: true,
  previousScanId: 'scan-0',
  previousScore: 60,
  currentScore: 75,
  fixed: [item('a', 'SEC-001', 'CSP missing', 'high')],
  new: [item('b', 'SEC-023', 'Sensitive port open', 'medium'), item('c', 'SEC-003', 'Referrer', 'low')],
  persisting: [item('d', 'SEC-005', 'Cookie without Secure', 'medium')]
};

// Renvoie l'élément <details> d'une catégorie à partir du texte de son <summary>.
const section = (label) => screen.getByText(label).closest('details');

test('shows the score change and the three categories with compact rows', () => {
  render(<ScanComparison comparison={comparison} onClose={jest.fn()} />);

  expect(screen.getByText('Score: 60 → 75')).toHaveClass('score-trend-up');

  // Fixed et New ouverts (non vides), Still open replié par défaut.
  expect(section('Fixed (1)')).toHaveAttribute('open');
  expect(section('New (2)')).toHaveAttribute('open');
  expect(section('Still open (1)')).not.toHaveAttribute('open');

  const fixedRow = within(section('Fixed (1)')).getByRole('listitem');
  expect(fixedRow).toHaveTextContent('SEC-001');
  expect(fixedRow).toHaveTextContent('CSP missing');
  expect(within(fixedRow).getByText('HIGH')).toHaveClass('severity-badge', 'severity-high');

  expect(within(section('New (2)')).getAllByRole('listitem')).toHaveLength(2);
  expect(within(section('Still open (1)')).getByText('Cookie without Secure')).toBeInTheDocument();
});

test('colours a score drop in red and keeps an empty category closed', () => {
  render(
    <ScanComparison comparison={{ ...comparison, previousScore: 90, currentScore: 70, fixed: [] }} onClose={jest.fn()} />
  );

  expect(screen.getByText('Score: 90 → 70')).toHaveClass('score-trend-down');
  expect(section('Fixed (0)')).not.toHaveAttribute('open');
});

test('explains that there is nothing to compare for the first scan of a target', () => {
  render(<ScanComparison comparison={{ hasPrevious: false }} onClose={jest.fn()} />);

  expect(screen.getByText('This is the first scan for this target - nothing to compare yet.')).toBeInTheDocument();
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
  expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
});

test('reports no changes when the three lists are empty', () => {
  render(
    <ScanComparison
      comparison={{ ...comparison, previousScore: 75, fixed: [], new: [], persisting: [] }}
      onClose={jest.fn()}
    />
  );

  expect(screen.getByText('Score: 75 → 75')).toHaveClass('score-trend-same');
  expect(screen.getByText('No changes detected since the last scan.')).toBeInTheDocument();
  expect(document.querySelector('details')).not.toBeInTheDocument();
});

test('reports no changes but still lists the findings that remain open', () => {
  render(<ScanComparison comparison={{ ...comparison, previousScore: 75, fixed: [], new: [] }} onClose={jest.fn()} />);

  expect(screen.getByText('No changes detected since the last scan.')).toBeInTheDocument();
  expect(section('Still open (1)')).not.toHaveAttribute('open');
});

test('calls onClose when the close button is clicked', () => {
  const onClose = jest.fn();
  render(<ScanComparison comparison={comparison} onClose={onClose} />);

  fireEvent.click(screen.getByRole('button', { name: 'Close comparison' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
