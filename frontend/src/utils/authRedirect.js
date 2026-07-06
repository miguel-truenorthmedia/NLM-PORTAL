export const AUTH_TOKEN_KEY = "nlm-auth-token";

export function redirectToLogin(returnPath) {
  const params = returnPath ? `?redirect=${encodeURIComponent(returnPath)}` : "";
  window.location.assign(`/login${params}`);
}
