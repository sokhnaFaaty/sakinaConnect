// utils/auth.js
const SESSION_KEY = "currentUser";

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession() {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated() {
  return getSession() !== null;
}

export function getUserRole() {
  const user = getSession();
  return user ? user.role : null;
}

export function hasRole(...roles) {
  const role = getUserRole();
  return roles.includes(role);
}