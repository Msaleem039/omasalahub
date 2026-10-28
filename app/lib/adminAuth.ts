const SESSION_KEY = "masalahub_admin";

const SUPERADMIN_EMAIL = "admin@masalahub.com";
const SUPERADMIN_PASSWORD = "admin123";

export function loginSuperadmin(email: string, password: string) {
  const matches = email.trim().toLowerCase() === SUPERADMIN_EMAIL && password === SUPERADMIN_PASSWORD;
  if (!matches) return false;
  localStorage.setItem(SESSION_KEY, "1");
  return true;
}

export function logoutSuperadmin() {
  localStorage.removeItem(SESSION_KEY);
}

export function isSuperadmin() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_KEY) === "1";
}
