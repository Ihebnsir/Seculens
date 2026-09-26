import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function RegisterForm({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

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
      await register(email.trim(), password);
    } catch (requestError) {
      setError(requestError.message || 'La création du compte a échoué.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-panel">
      <div className="auth-panel-heading">
        <span className="eyebrow">NEW WORKSPACE</span>
        <h2>Register</h2>
        <p>Create your SecuLens account.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="register-email">Email</label>
        <input
          id="register-email"
          className="auth-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label className="field-label" htmlFor="register-password">Password</label>
        <input
          id="register-password"
          className="auth-input"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <label className="field-label" htmlFor="register-confirmation">Confirm password</label>
        <input
          id="register-confirmation"
          className="auth-input"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
        />

        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Register'}
        </button>
      </form>

      <p className="auth-switch-line">
        Already have an account?{' '}
        <button className="text-button" type="button" onClick={onSwitchToLogin}>
          Log in
        </button>
      </p>
    </section>
  );
}

export default RegisterForm;