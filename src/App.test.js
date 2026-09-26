import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.localStorage.clear();
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
