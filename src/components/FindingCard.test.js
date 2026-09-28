import { render, screen } from '@testing-library/react';
import FindingCard from './FindingCard';

const finding = {
  _id: 'f1', ruleId: 'SEC-001', title: 'CSP missing', severity: 'high', confidence: 'high',
  cwe: 'CWE-693', evidence: { header: 'Content-Security-Policy' }, description: 'No CSP.',
  remediation: 'Add a CSP.', fixed: false, aiExplanation: null
};

test('keeps the summary visible and folds remediation and evidence into a native details element', () => {
  const { container } = render(<FindingCard finding={finding} onSetFixed={jest.fn()} />);

  expect(container.querySelector('.finding-card')).toHaveClass('finding-high');
  expect(screen.getByRole('heading', { name: 'CSP missing' })).toBeInTheDocument();
  expect(screen.getByText('No CSP.')).toBeInTheDocument();

  const details = container.querySelector('details.finding-details');
  expect(details).toContainElement(screen.getByText('Add a CSP.'));
  expect(details).toContainElement(screen.getByText('Content-Security-Policy'));
  expect(screen.queryByText('Fixed')).not.toBeInTheDocument();
});

test.each([
  ['critical', true],
  ['high', true],
  ['medium', true],
  ['low', false],
  ['info', false]
])('opens the details of an open %s finding by default: %s', (severity, open) => {
  const { container } = render(<FindingCard finding={{ ...finding, severity }} onSetFixed={jest.fn()} />);
  expect(container.querySelector('details.finding-details').open).toBe(open);
});

test('labels a fixed finding with a "Fixed" tag and keeps its details folded', () => {
  const { container } = render(<FindingCard finding={{ ...finding, fixed: true }} onSetFixed={jest.fn()} />);
  expect(screen.getByText('Fixed')).toHaveClass('fixed-tag');
  expect(screen.getByRole('checkbox', { name: 'Mark as fixed' })).toBeChecked();
  expect(container.querySelector('details.finding-details').open).toBe(false);
});
