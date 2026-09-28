import { countFindings, sortFindingsBySeverity } from './severity';

const f = (id, severity, fixed = false) => ({ _id: id, severity, fixed });

test('puts open findings first, from most to least severe, and keeps the scanner order on ties', () => {
  const findings = [f('a', 'low'), f('b', 'high'), f('c', 'info', true), f('d', 'critical'), f('e', 'high'), f('g', 'critical', true)];
  expect(sortFindingsBySeverity(findings).map((x) => x._id)).toEqual(['d', 'b', 'e', 'a', 'g', 'c']);
});

test('does not modify the original list', () => {
  const findings = [f('a', 'low'), f('b', 'high')];
  sortFindingsBySeverity(findings);
  expect(findings.map((x) => x._id)).toEqual(['a', 'b']);
});

test('counts open findings per severity and fixed findings separately', () => {
  const counts = countFindings([f('a', 'high'), f('b', 'high'), f('c', 'low', true), f('d', 'info')]);
  expect(counts).toEqual({ open: { critical: 0, high: 2, medium: 0, low: 0, info: 1 }, fixed: 1 });
});
