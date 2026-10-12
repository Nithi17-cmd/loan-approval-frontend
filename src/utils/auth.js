const STORAGE_KEY = 'loanApprovalAuth';

export function normalizeRole(value) {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return normalizeRole(value.find(Boolean));
  }

  const text = String(value).trim();
  const withoutPrefix = text.replace(/^ROLE_/, '').toUpperCase();

  if (['APPLICANT', 'OFFICER', 'ADMIN'].includes(withoutPrefix)) {
    return withoutPrefix;
  }

  return null;
}

export function decodeJwtToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch (error) {
    return null;
  }
}

export function getRoleFromToken(token) {
  const payload = decodeJwtToken(token);
  if (!payload) {
    return null;
  }

  const directRole = normalizeRole(payload.role ?? payload.authority ?? payload.roles ?? payload.authorities);
  if (directRole) {
    return directRole;
  }

  if (Array.isArray(payload.authorities)) {
    return normalizeRole(payload.authorities.find((entry) => normalizeRole(entry)));
  }

  if (Array.isArray(payload.roles)) {
    return normalizeRole(payload.roles.find((entry) => normalizeRole(entry)));
  }

  return null;
}

export function readAuthSession() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.token) {
      return null;
    }

    return {
      token: parsed.token,
      role: normalizeRole(parsed.role) ?? getRoleFromToken(parsed.token),
      username: typeof parsed.username === 'string' ? parsed.username : null,
    };
  } catch (error) {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveAuthSession({ token, role, username }) {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token,
      role: normalizeRole(role) ?? getRoleFromToken(token),
      username: typeof username === 'string' ? username : null,
    }),
  );
}

export function clearAuthSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getDashboardPathForRole(role) {
  switch (normalizeRole(role)) {
    case 'APPLICANT':
      return '/applicant';
    case 'OFFICER':
      return '/officer';
    case 'ADMIN':
      return '/admin';
    default:
      return '/login';
  }
}
