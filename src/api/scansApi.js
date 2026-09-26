const API_URL = process.env.REACT_APP_API_URL;
export const UNAUTHORIZED_EVENT = 'seculens:unauthorized';

async function request(path, options = {}) {
  let response;
  const token = localStorage.getItem('seculens_token');

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
  } catch (error) {
    throw new Error('Cannot reach the SecuLens API. Is the server running?');
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error || 'The request to the SecuLens API failed.');
    error.status = response.status;
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw error;
  }

  return data;
}

// Certaines routes renvoient directement l'objet, d'autres l'incluent dans une propriété.
export async function createScan(target) {
  const data = await request('/scans', {
    method: 'POST',
    body: JSON.stringify({ target })
  });
  return data?.scan || data;
}

export async function getScans() {
  const data = await request('/scans');
  return data?.scans || data;
}

export async function getScan(scanId) {
  if (!scanId) {
    throw new Error('Identifiant du scan manquant.');
  }

  const data = await request(`/scans/${encodeURIComponent(scanId)}`);
  return data?.scan || data;
}

export async function setFindingFixed(scanId, findingId, fixed) {
  if (!scanId || !findingId) {
    throw new Error('Identifiant du scan ou du finding manquant.');
  }

  const data = await request(
    `/scans/${encodeURIComponent(scanId)}/findings/${encodeURIComponent(findingId)}`,
    {
    method: 'PATCH',
    body: JSON.stringify({ fixed })
    }
  );
  return data?.scan || data;
}

export async function deleteScan(scanId) {
  if (!scanId) {
    throw new Error('Identifiant du scan manquant.');
  }

  return request(`/scans/${encodeURIComponent(scanId)}`, { method: 'DELETE' });
}