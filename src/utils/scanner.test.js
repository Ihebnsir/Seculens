import { formatScannerVersion } from './scanner';

test('shows the scanner version, or a clear label for older scans without one', () => {
  expect(formatScannerVersion('1.0')).toBe('Scanner v1.0');
  expect(formatScannerVersion(undefined)).toBe('Scanner version unknown');
  expect(formatScannerVersion(null)).toBe('Scanner version unknown');
});
