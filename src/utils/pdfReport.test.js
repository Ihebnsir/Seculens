import { jsPDF } from 'jspdf';
import { buildReportFileName, toPdfText, writeScanReport } from './pdfReport';

const baseFinding = {
  ruleId: 'SEC-001', title: 'CSP missing', severity: 'high', confidence: 'high', cwe: 'CWE-693',
  description: 'No Content-Security-Policy header.', remediation: 'Add a strict CSP.', fixed: false
};

test('builds a safe file name from the target and the scan date', () => {
  expect(buildReportFileName('https://example.com:8080/a?b=c', '2026-09-29T10:00:00'))
    .toBe('seculens-report-example.com-8080-a-b-c-2026-09-29.pdf');
  expect(buildReportFileName('', 'invalid')).toMatch(/^seculens-report-scan-\d{4}-\d{2}-\d{2}\.pdf$/);
});

test('replaces characters the standard PDF fonts cannot draw', () => {
  expect(toPdfText('80 → 60 — “ok” é')).toBe('80 -> 60 - "ok" é');
});

test('paginates a long report instead of writing past the bottom of the page', () => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageHeight = doc.internal.pageSize.getHeight();
  const textSpy = jest.spyOn(doc, 'text');
  const findings = Array.from({ length: 40 }, (_, index) => ({
    ...baseFinding,
    _id: `f${index}`,
    description: 'Long description. '.repeat(30),
    owasp: { code: 'A05:2021', name: 'Security Misconfiguration' },
    aiExplanation: { simpleExplanation: 'x', realWorldRisk: 'y', fixSteps: ['z'] }
  }));

  writeScanReport(doc, {
    target: 'https://example.com', createdAt: '2026-09-29T10:00:00', status: 200, score: 40,
    scannerVersion: '1.3.0', scoreRegression: { previousScore: 80, previousScanId: 's0', drop: 40 }, findings
  });

  expect(doc.getNumberOfPages()).toBeGreaterThan(3);
  textSpy.mock.calls.forEach(([, , y]) => expect(y).toBeLessThanOrEqual(pageHeight - 5));
});
