import { useState } from 'react';
import { resendVerification } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setVerificationRequired(false);
    setResendMessage('');
    setResendError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (requestError) {
      if (requestError.status === 403 && requestError.emailVerified === false) {
        setError('Please verify your email first.');
        setVerificationRequired(true);
      } else {
        setError(requestError.message || 'Email ou mot de passe incorrect.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage('');
    setResendError('');

    try {
      await resendVerification(email.trim());
      setResendMessage('If this account exists and is not verified, a verification email has been sent.');
    } catch (requestError) {
      setResendError(requestError.message || 'The email could not be resent.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <section className="auth-panel">
      <div className="auth-panel-heading">
        <span className="eyebrow">SECURE ACCESS</span>
        <h2>Log in</h2>
        <p>Access your security workspace.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="login-email">Email</label>
        <input
          id="login-email"
          className="auth-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label className="field-label" htmlFor="login-password">Password</label>
        <input
          id="login-password"
          className="auth-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Log in'}
        </button>
      </form>

      {verificationRequired && (
        <div className="auth-form">
          {resendMessage && <p className="success-message" role="status">{resendMessage}</p>}
          {resendError && <p className="error-message" role="alert">{resendError}</p>}
          <button className="secondary-button auth-submit" type="button" onClick={handleResend} disabled={resendLoading}>
            {resendLoading ? 'Sending...' : 'Resend verification email'}
          </button>
        </div>
      )}

      <p className="auth-switch-line">
        <button className="text-button" type="button" onClick={onSwitchToForgotPassword}>
          Forgot password?
        </button>
      </p>
      <p className="auth-switch-line">
        Don’t have an account?{' '}
        <button className="text-button" type="button" onClick={onSwitchToRegister}>
          Register
        </button>
      </p>
    </section>
  );
}

export default LoginForm;