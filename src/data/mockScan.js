export const mockScan = {
  target: 'https://localhost:3000',
  scannedAt: '2026-09-24T18:45:00Z',
  status: 200,
  score: 72,
  findings: [
    {
      ruleId: 'missing-csp',
      title: 'Missing Content Security Policy',
      severity: 'high',
      confidence: 'high',
      cwe: 'CWE-693',
      evidence: { header: 'Content-Security-Policy', present: false },
      description: 'The application does not define a restrictive content security policy header.',
      remediation: 'Add a CSP header that restricts script execution and resources to trusted origins.'
    },
    {
      ruleId: 'weak-headers',
      title: 'Security headers are partially missing',
      severity: 'medium',
      confidence: 'high',
      cwe: 'CWE-693',
      evidence: { header: 'X-Frame-Options', present: false },
      description: 'Several security response headers are absent or not configured consistently.',
      remediation: 'Enable strict security headers such as X-Frame-Options, X-Content-Type-Options, and Referrer-Policy.'
    },
    {
      ruleId: 'insecure-cookies',
      title: 'Cookies are not marked with secure attributes',
      severity: 'high',
      confidence: 'medium',
      cwe: 'CWE-614',
      evidence: { header: 'Set-Cookie', present: true, note: 'Cookie flags missing Secure and HttpOnly' },
      description: 'Session cookies are not protected against interception and client-side script access.',
      remediation: 'Set the Secure, HttpOnly, and SameSite attributes on all session cookies.'
    },
    {
      ruleId: 'sqli-warning',
      title: 'Potential SQL injection exposure in legacy endpoint',
      severity: 'critical',
      confidence: 'medium',
      cwe: 'CWE-89',
      evidence: { parameter: 'search', present: true, note: 'Input is concatenated into a SQL query string' },
      description: 'A legacy search path appears to build a SQL query from untrusted input.',
      remediation: 'Use parameterized queries and enforce input validation before any database interaction.'
    },
    {
      ruleId: 'debug-info',
      title: 'Debug information is exposed in responses',
      severity: 'low',
      confidence: 'low',
      cwe: 'CWE-532',
      evidence: { header: 'Server', present: true, note: 'Detailed stack traces visible in error output' },
      description: 'Error pages reveal internal details that could help an attacker understand the application stack.',
      remediation: 'Disable verbose debug output in production and replace it with generic error responses.'
    }
  ]
};
