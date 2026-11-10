import httpClient, { authClient } from "@/services/httpClient";

// Signing in and the signed-in admin's own account.
// Sign-in answers id, name, email, user_type, roles, permissions, token and
// expires_at; a client or employee account gets 403 naming its own app, and
// too many failed attempts from one network give 429.

export const signIn = ({ email, password }) => authClient.post("/admin/login", { email, password });

/** Emails a one-time code for a password reset. */
export const sendResetCode = (email) => authClient.post("/admin/otp", { email });

/** Checks the code; the answer's token (valid 30 minutes) allows the reset. */
export const verifyResetCode = ({ email, otp }) => authClient.post("/admin/verify-otp", { email, otp });

export const resetPassword = ({ email, password, confirm_password, token }) =>
  authClient.post("/admin/forgot-password", { email, password, confirm_password, token });

/** id, name, email, mobile, is_active, created_at, user_type, roles, permissions. */
export const getProfile = () => httpClient.get("/profile");

/** Ends this browser's session only. */
export const signOut = () => httpClient.post("/logout");

/** A new password ends every session, so the next call answers 401. */
export const changePassword = ({ old_password, new_password, confirm_password }) =>
  httpClient.post("/change-password", { old_password, new_password, confirm_password });

/** Everyone's sign-ins, grouped by user; each row has app and time_zone. */
export const listLoginActivity = () => httpClient.get("/login-activity");

/** Clears ended sessions only (needs records.delete), so nobody is signed out. */
export const clearLoginActivity = () => httpClient.delete("/login-activity");
