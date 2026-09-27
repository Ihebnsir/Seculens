import { useState } from 'react';
import { forgotPassword } from '../api/authApi';

function ForgotPasswordForm({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await forgotPassword(email.trim());
      setMessage('If this email exists, a reset link has been sent.');
    } catch (requestError) {
      if (requestError.isNetworkError) {
        setError(requestError.message || 'Unable to reach the server. Please try again.');
      } else {
        setMessage('If this email exists, a reset link has been sent.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-panel">
      <div className="auth-panel-heading">
        <span className="eyebrow">ACCOUNT RECOVERY</span>
        <h2>Forgot password</h2>
        <p>Enter your email to request a password reset link.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="forgot-email">Email</label>
        <input
          id="forgot-email"
          className="auth-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        {message && <p className="success-message" role="status">{message}</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="auth-switch-line">
        <button className="text-button" type="button" onClick={onSwitchToLogin}>
          Back to login
        </button>
      </p>
    </section>
  );
}

export default ForgotPasswordForm;