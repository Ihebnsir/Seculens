import { render, screen } from '@testing-library/react';
import FindingCard from './FindingCard';
import { splitNumberedSteps } from './AiInsight';

const baseFinding = {
  _id: 'f1', ruleId: 'SEC-002', title: 'nosniff missing', severity: 'medium', confidence: 'high',
  cwe: 'CWE-693', evidence: {}, description: 'd', remediation: 'r', fixed: false
};

test('shows nothing when the AI failed for a finding', () => {
  const failed = { simpleExplanation: null, realWorldRisk: null, fixSteps: null };
  render(<FindingCard finding={{ ...baseFinding, aiExplanation: failed }} onSetFixed={jest.fn()} />);
  expect(screen.queryByText('AI Insight')).not.toBeInTheDocument();
});

test('shows nothing before the AI has processed the finding', () => {
  render(<FindingCard finding={{ ...baseFinding, aiExplanation: null }} onSetFixed={jest.fn()} />);
  expect(screen.queryByText('AI Insight')).not.toBeInTheDocument();
});

test('splits numbered steps written on one line or on separate lines', () => {
  expect(splitNumberedSteps('1. Add it. 2. Test it. 3. Deploy.').steps).toEqual(['Add it.', 'Test it.', 'Deploy.']);
  expect(splitNumberedSteps('Intro.\n1. Add it.\n2. Test it.')).toEqual({ intro: 'Intro.', steps: ['Add it.', 'Test it.'] });
});

test('does not invent a list from numbers inside a sentence', () => {
  expect(splitNumberedSteps('Use TLS 1.2 or 1.3 on the server.').steps).toEqual([]);
  expect(splitNumberedSteps('Step 2. is alone here.').steps).toEqual([]);
});
