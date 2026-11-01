/** Account sessions are issued by /api/auth/login. Browser flags are not accepted. */
export function loginSuperadmin() {
  return false;
}

export function logoutSuperadmin() {}

export function isSuperadmin() {
  return false;
}
