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
    throw new Error(data?.error || 'La demande de connexion a échoué.');
  }

  return data;
}

export function register(email, password) {
  return sendCredentials('register', email, password);
}

export function login(email, password) {
  return sendCredentials('login', email, password);
}