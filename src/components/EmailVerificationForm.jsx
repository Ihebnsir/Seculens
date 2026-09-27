import { useState } from 'react';
import { verifyEmail } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

function EmailVerificationForm({ token }) {
  const { logout } = useAuth();
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setStatus('loading');
    setError('');

    try {
      await verifyEmail(token);
      logout();
      setStatus('success');
    } catch (requestError) {
      setError(requestError.message || 'Email verification failed.');
      setStatus('error');
    }
  };

  return (
    <section className="auth-panel">
      <div className="auth-panel-heading">
        <span className="eyebrow">ACCOUNT VERIFICATION</span>
        <h2>Verify your email</h2>
        <p>Confirming the email address for your SecuLens account.</p>
      </div>

      {status === 'ready' && (
        <div className="auth-form">
          <p>Click the button to confirm your email address.</p>
          <button className="primary-button auth-submit" type="button" onClick={handleVerify}>
            Verify email address
          </button>
        </div>
      )}

      {status === 'loading' && (
        <p className="auth-switch-line" role="status">Verifying your email...</p>
      )}

      {status === 'success' && (
        <div className="auth-form">
          <p className="success-message" role="status">Your email is verified. You can now log in.</p>
          <a className="text-button" href="/" onClick={logout}>Go to login</a>
        </div>
      )}

      {status === 'error' && (
        <div className="auth-form">
          <p className="error-message" role="alert">{error}</p>
          <button
            className="text-button"
            type="button"
            onClick={() => { window.location.href = '/'; }}
          >
            Return to home
          </button>
        </div>
      )}
    </section>
  );
}

export default EmailVerificationForm;