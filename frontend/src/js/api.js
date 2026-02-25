export class AuthExpiredError extends Error {
  constructor(message = "Session expirée") {
    super(message);
    this.name = "AuthExpiredError";
  }
}

function throwIfUnauthorized(res) {
  if (res && res.status === 401) {
    throw new AuthExpiredError("Session expirée. Merci de te reconnecter.");
  }
}

export async function getApplications(config, token) {
  const res = await fetch(`${config.apiUrl}/applications`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  throwIfUnauthorized(res);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error (${res.status}): ${text}`);
  }

  return await res.json();
}

export async function patchApplication(config, token, applicationId, payload) {
  const res = await fetch(`${config.apiUrl}/applications/${applicationId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload || {}),
  });

  throwIfUnauthorized(res);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API PATCH error (${res.status}): ${text}`);
  }

  return await res.json();
}

export async function deleteApplication(config, token, applicationId) {
  const res = await fetch(`${config.apiUrl}/applications/${applicationId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  throwIfUnauthorized(res);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API DELETE error (${res.status}): ${text}`);
  }

  // Some APIs return 204 No Content
  if (res.status === 204) return { ok: true };
  return await res.json();
}

export async function createApplication(config, token, payload) {
  const res = await fetch(`${config.apiUrl}/applications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload || {}),
  });

  throwIfUnauthorized(res);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API POST error (${res.status}): ${text}`);
  }

  return await res.json();
}