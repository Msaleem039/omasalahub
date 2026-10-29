const SESSION_KEY = "masalahub_admin";

export function loginSuperadmin(_email: string, _password: string) {
  // Temporary: any login opens the admin panel while it is being tested.
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
