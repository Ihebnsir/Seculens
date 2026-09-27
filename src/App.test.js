import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import App from './App';
import { getInitialTheme } from './utils/theme';

beforeEach(() => {
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
  document.documentElement.removeAttribute('data-theme');
});

test('shows the login screen when no session is saved', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'SecuLens' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Start Scan' })).not.toBeInTheDocument();
});

test('switches to registration and validates the password length', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Register' }));
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'short' } });
  fireEvent.click(screen.getByRole('button', { name: 'Register' }));
  expect(screen.getByRole('alert')).toHaveTextContent('au moins 8 caractères');
});

test('registration asks the user to verify email and offers a generic resend', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: 'Compte créé.', email: 'new@example.com' })
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'If this account exists and is not verified, a verification email has been sent.' })
    });

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Register' }));
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure-password' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'secure-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Register' }));

  expect(await screen.findByText(/We sent a verification link to new@example.com/)).toBeInTheDocument();
  expect(window.localStorage.getItem('seculens_token')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Resend email' }));
  expect(await screen.findByRole('status')).toHaveTextContent('If this account exists and is not verified');
  expect(global.fetch).toHaveBeenNthCalledWith(
    2,
    expect.stringMatching(/\/auth\/resend-verification$/),
    expect.objectContaining({ body: JSON.stringify({ email: 'new@example.com' }) })
  );
});

test('unverified login offers a resend action without changing the entered email', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Veuillez vérifier votre email avant de vous connecter.', emailVerified: false })
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'If this account exists and is not verified, a verification email has been sent.' })
    });

  render(<App />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'person@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Please verify your email first.');
  fireEvent.click(screen.getByRole('button', { name: 'Resend verification email' }));
  expect(await screen.findByRole('status')).toHaveTextContent('If this account exists and is not verified');
  expect(global.fetch).toHaveBeenNthCalledWith(
    2,
    expect.stringMatching(/\/auth\/resend-verification$/),
    expect.objectContaining({ body: JSON.stringify({ email: 'person@example.com' }) })
  );
});

test('clears an existing session when a protected request identifies an unverified account', async () => {
  window.localStorage.setItem('seculens_token', 'old-session-token');
  window.localStorage.setItem('seculens_user', JSON.stringify({ email: 'person@example.com' }));
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: false,
    status: 403,
    json: async () => ({ error: 'Veuillez vérifier votre email avant de vous connecter.', emailVerified: false })
  });

  render(<App />);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });
  expect(window.localStorage.getItem('seculens_token')).toBeNull();
});

test('shows the same generic confirmation after requesting a reset link', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ message: 'If this email exists, a reset link has been sent.' })
  });

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'person@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

  expect(await screen.findByRole('status')).toHaveTextContent(
    'If this email exists, a reset link has been sent.'
  );
  expect(global.fetch.mock.calls[0][0]).toMatch(/\/auth\/forgot-password$/);
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ email: 'person@example.com' });
});

test('shows reset form for a saved session and displays the server error', async () => {
  window.localStorage.setItem('seculens_token', 'saved-session-token');
  window.localStorage.setItem('seculens_user', JSON.stringify({ email: 'person@example.com' }));
  window.history.pushState({}, '', '/reset-password/reset-token-123');
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: false,
    status: 400,
    json: async () => ({ error: 'Reset link is invalid or expired.' })
  });

  render(<App />);
  expect(screen.getByRole('heading', { name: 'Reset password' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password-123' } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new-password-123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Reset link is invalid or expired.');
  expect(screen.getByRole('button', { name: 'Request a new reset link' })).toBeInTheDocument();
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({
    token: 'reset-token-123',
    newPassword: 'new-password-123'
  });
});

test('verifies email only after explicit confirmation, even with a saved session', async () => {
  window.localStorage.setItem('seculens_token', 'saved-session-token');
  window.localStorage.setItem('seculens_user', JSON.stringify({ email: 'person@example.com' }));
  window.history.pushState({}, '', '/verify-email/verify-token-456');
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ message: 'Email verified successfully!' })
  });

  render(<StrictMode><App /></StrictMode>);

  expect(screen.getByRole('button', { name: 'Verify email address' })).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Verify email address' }));
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent('Your email is verified. You can now log in.');
  });
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringMatching(/\/auth\/verify-email$/),
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ token: 'verify-token-456' })
    })
  );
  expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
  expect(window.localStorage.getItem('seculens_token')).toBeNull();
  expect(screen.getByRole('link', { name: 'Go to login' })).toHaveAttribute('href', '/');
});

test('shows the server error only after confirming an invalid email verification link', async () => {
  window.history.pushState({}, '', '/verify-email/expired-token');
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: false,
    status: 400,
    json: async () => ({ error: 'Verification link is invalid or expired.' })
  });

  render(<StrictMode><App /></StrictMode>);

  expect(global.fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Verify email address' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Verification link is invalid or expired.');
  expect(screen.getByRole('button', { name: 'Return to home' })).toBeInTheDocument();
});

test('saves the session, sends its token to scans, and logs out on 401', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: 'test-token', user: { id: 'user-1', email: 'dev@example.com' } })
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => []
    })
    .mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Session expired' })
    });

  render(<App />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'dev@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

  await waitFor(() => expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument());
  expect(window.localStorage.getItem('seculens_token')).toBe('test-token');
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  expect(global.fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer test-token');

  fireEvent.change(screen.getByLabelText('Target URL'), { target: { value: 'https://example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Start Scan' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument());
  expect(global.fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer test-token');
  expect(window.localStorage.getItem('seculens_token')).toBeNull();
});

test('switches between dark and light themes and saves the choice', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  expect(window.localStorage.getItem('seculens_theme')).toBe('light');

  fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  expect(window.localStorage.getItem('seculens_theme')).toBe('dark');
});

test('uses the saved theme first, then falls back to dark', () => {
  expect(getInitialTheme()).toBe('dark');
  window.localStorage.setItem('seculens_theme', 'light');
  expect(getInitialTheme()).toBe('light');
});

test('polls the AI status after a scan, survives a network error, then shows the AI insight', async () => {
  window.localStorage.setItem('seculens_token', 'test-token');
  window.localStorage.setItem('seculens_user', JSON.stringify({ id: 'user-1', email: 'dev@example.com' }));
  const finding = {
    _id: 'finding-1', ruleId: 'SEC-001', title: 'CSP missing', severity: 'high', confidence: 'high',
    cwe: 'CWE-693', evidence: { header: 'Content-Security-Policy' }, description: 'No CSP.',
    remediation: 'Add a CSP.', fixed: false, aiExplanation: null
  };
  const scan = { _id: 'scan-1', target: 'https://example.com', status: 200, score: 80, findings: [finding] };
  const explainedScan = {
    ...scan,
    findings: [{
      ...finding,
      aiExplanation: {
        simpleExplanation: 'The browser has no content rules.',
        realWorldRisk: 'Injected scripts would run.',
        fixSteps: '1. Add the header. 2. Test the site.'
      }
    }]
  };
  let aiStatusCalls = 0;
  const json = (body, status = 200) => Promise.resolve({ ok: status < 300, status, json: async () => body });
  // Le faux backend répond selon l'URL appelée, quel que soit l'ordre des appels.
  global.fetch = jest.fn((url, options = {}) => {
    if (url.endsWith('/ai-status')) {
      aiStatusCalls += 1;
      return aiStatusCalls === 1 ? Promise.reject(new TypeError('Failed to fetch')) : json({ ready: true });
    }
    if (url.endsWith('/scans/scan-1')) return json(explainedScan);
    if (url.endsWith('/scans') && options.method === 'POST') return json(scan, 201);
    if (url.endsWith('/scans')) return json([]);
    return json({ error: 'unexpected' }, 500);
  });

  render(<App />);
  fireEvent.change(screen.getByLabelText('Target URL'), { target: { value: 'https://example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Start Scan' }));

  expect(await screen.findByText('CSP missing')).toBeInTheDocument();
  expect(screen.getByText('AI is analyzing these findings...')).toBeInTheDocument();
  expect(screen.queryByText('AI Insight')).not.toBeInTheDocument();

  expect(await screen.findByText('The browser has no content rules.', {}, { timeout: 9000 })).toBeInTheDocument();
  expect(screen.queryByText('AI is analyzing these findings...')).not.toBeInTheDocument();
  expect(screen.getByText('Add the header.').tagName).toBe('LI');
  expect(aiStatusCalls).toBe(2);
}, 15000);
