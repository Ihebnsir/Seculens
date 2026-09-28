import { act, render } from '@testing-library/react';
import ResultsPanel from './ResultsPanel';
import ScoreCard from './ScoreCard';

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
