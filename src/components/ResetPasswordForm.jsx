import { useState } from 'react';
import { resetPassword } from '../api/authApi';

function ResetPasswordForm({ token, onRequestNewLink }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [canRequestNewLink, setCanRequestNewLink] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setCanRequestNewLink(false);

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (requestError) {
      setError(requestError.message || 'Password reset failed. Please request a new link.');
      setCanRequestNewLink(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-panel">
      <div className="auth-panel-heading">
        <span className="eyebrow">ACCOUNT RECOVERY</span>
        <h2>Reset password</h2>
        <p>Choose a new password for your account.</p>
      </div>

      {success ? (
        <div className="auth-form">
          <p className="success-message" role="status">
            Password updated. You can now log in.
          </p>
          <p className="auth-switch-line">
            <button
              className="text-button"
              type="button"
              onClick={() => { window.location.href = '/'; }}
            >
              Back to login
            </button>
          </p>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="reset-password">New password</label>
          <input
            id="reset-password"
            className="auth-input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <label className="field-label" htmlFor="reset-confirmation">Confirm new password</label>
          <input
            id="reset-confirmation"
            className="auth-input"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
          />

          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Reset password'}
          </button>
        </form>
      )}

      {!success && canRequestNewLink && (
        <p className="auth-switch-line">
          <button className="text-button" type="button" onClick={onRequestNewLink}>
            Request a new reset link
          </button>
        </p>
      )}
    </section>
  );
}

export default ResetPasswordForm;