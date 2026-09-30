const API_URL = process.env.REACT_APP_API_URL;

async function sendCredentials(endpoint, email, password) {
  let response;

  try {
    response = await fetch(`${API_URL}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  } catch (error) {
    throw new Error('Impossible de joindre le serveur SecuLens.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const requestError = new Error(data?.error || 'La demande de connexion a échoué.');
    requestError.status = response.status;
    throw requestError;
  }

  return data;
}

export function register(email, password) {
  return sendCredentials('register', email, password);
}

export function login(email, password) {
  return sendCredentials('login', email, password);
}

async function sendPasswordRequest(endpoint, body) {
  let response;

  try {
    response = await fetch(`${API_URL}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (error) {
    const networkError = new Error('Impossible de joindre le serveur SecuLens.');
    networkError.isNetworkError = true;
    throw networkError;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || 'La demande a échoué.');
  }

  return data;
}

export function forgotPassword(email) {
  return sendPasswordRequest('forgot-password', { email });
}

export function resetPassword(token, newPassword) {
  return sendPasswordRequest('reset-password', { token, newPassword });
}

export function verifyEmail(token) {
  return sendPasswordRequest('verify-email', { token });
}