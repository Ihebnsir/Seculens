import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (requestError) {
      setError(requestError.message || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
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