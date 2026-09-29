import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ResultsPanel from './ResultsPanel';
import ScoreCard from './ScoreCard';

// Vrai jsPDF (le rapport est réellement construit) : seul le téléchargement final est simulé.
const mockSave = jest.fn();
jest.mock('jspdf', () => {
  const { jsPDF: RealJsPDF } = jest.requireActual('jspdf');
  return {
    jsPDF: function MockJsPDF(options) {
      const doc = new RealJsPDF(options);
      doc.save = mockSave;
      return doc;
    }
  };
});

const findings = [
  { _id: 'f1', ruleId: 'SEC-001', title: 'CSP missing', severity: 'high', confidence: 'high', cwe: 'CWE-693', evidence: {}, description: 'd', remediation: 'r', fixed: false },
  { _id: 'f2', ruleId: 'SEC-003', title: 'Referrer', severity: 'low', confidence: 'high', cwe: 'CWE-200', evidence: {}, description: 'd', remediation: 'r', fixed: false }
];
const scan = { _id: 'scan-1', target: 'https://example.com', status: 200, score: 75, findings };

afterEach(() => jest.useRealTimers());

test('plays the cascade only when a scan opens, with a growing delay per finding', () => {
  jest.useFakeTimers();
  const { container, rerender } = render(<ResultsPanel scan={scan} onSetFindingFixed={jest.fn()} />);
  const panel = container.querySelector('.results-panel');
  expect(panel).toHaveClass('is-appearing');
  const cards = container.querySelectorAll('.finding-card');
  expect(cards[0].style.getPropertyValue('--appear-index')).toBe('1');
  expect(cards[1].style.getPropertyValue('--appear-index')).toBe('2');

  act(() => { jest.advanceTimersByTime(900); });
  expect(panel).not.toHaveClass('is-appearing');

  // Même scan mis à jour (finding corrigé, explications IA) : pas de nouvelle cascade.
  rerender(<ResultsPanel scan={{ ...scan, score: 80 }} onSetFindingFixed={jest.fn()} />);
  expect(panel).not.toHaveClass('is-appearing');

  // Autre scan : la cascade rejoue.
  rerender(<ResultsPanel scan={{ ...scan, _id: 'scan-2' }} onSetFindingFixed={jest.fn()} />);
  expect(panel).toHaveClass('is-appearing');
});

test('flashes the score only when it changes', () => {
  const { container, rerender } = render(<ScoreCard score={75} findings={findings} />);
  expect(container.querySelector('.score-flash')).not.toBeInTheDocument();

  rerender(<ScoreCard score={75} findings={findings} />);
  expect(container.querySelector('.score-flash')).not.toBeInTheDocument();

  rerender(<ScoreCard score={80} findings={findings} />);
  expect(container.querySelector('.score-flash')).toBeInTheDocument();
});

test('shows a factual banner when the backend reports a score regression', () => {
  const { rerender } = render(<ResultsPanel scan={scan} onSetFindingFixed={jest.fn()} />);
  expect(document.querySelector('.score-regression')).not.toBeInTheDocument();

  rerender(
    <ResultsPanel
      scan={{ ...scan, scoreRegression: { previousScore: 95, previousScanId: 'scan-0', drop: 20 } }}
      onSetFindingFixed={jest.fn()}
    />
  );
  expect(document.querySelector('.score-regression'))
    .toHaveTextContent('Security score dropped by 20 points since the last scan (95 → 75)');
});

test('generates and downloads the PDF report when the button is clicked', async () => {
  render(<ResultsPanel scan={{ ...scan, createdAt: '2026-09-29T10:00:00' }} onSetFindingFixed={jest.fn()} />);

  fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
  expect(screen.getByRole('button', { name: 'Generating PDF...' })).toBeDisabled();

  await waitFor(() => expect(mockSave).toHaveBeenCalledWith('seculens-report-example.com-2026-09-29.pdf'));
  expect(await screen.findByRole('button', { name: 'Download PDF' })).toBeEnabled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
