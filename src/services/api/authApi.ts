import httpClient, { authClient } from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { LoginActivity, SessionUser, SignInAnswer } from "@/types";

// Signing in and the signed-in admin's own account.

// Sign-in answers id, name, email, user_type, roles, permissions, token and
// expires_at; a client or employee account gets 403 naming its own app, and
// too many failed attempts from one network give 429.
export const signIn = ({ email, password }: { email: string; password: string }): ApiCall<SignInAnswer> =>
  authClient.post("/admin/login", { email, password });

/** Emails a one-time code for a password reset. */
export const sendResetCode = (email: string): ApiCall<null> => authClient.post("/admin/otp", { email });

/** Checks the code; the answer's token (valid 30 minutes) allows the reset. */
export const verifyResetCode = ({ email, otp }: { email: string; otp: string }): ApiCall<{ token: string }> =>
  authClient.post("/admin/verify-otp", { email, otp });

export interface PasswordReset {
  email: string;
  password: string;
  confirm_password: string;
  token: string;
}

export const resetPassword = ({ email, password, confirm_password, token }: PasswordReset): ApiCall<null> =>
  authClient.post("/admin/forgot-password", { email, password, confirm_password, token });

/** id, name, email, mobile, is_active, created_at, user_type, roles, permissions. */
export const getProfile = (): ApiCall<SessionUser> => httpClient.get("/profile");

/** Ends this browser's session only. */
export const signOut = (): ApiCall<null> => httpClient.post("/logout");

export interface PasswordChange {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

/** A new password ends every session, so the next call answers 401. */
export const changePassword = ({ old_password, new_password, confirm_password }: PasswordChange): ApiCall<null> =>
  httpClient.post("/change-password", { old_password, new_password, confirm_password });

/** Everyone's sign-ins, grouped by user id; each row has app and time_zone. */
export const listLoginActivity = (): ApiCall<LoginActivity> =>
  httpClient.get("/login-activity");

/** Clears ended sessions only (needs records.delete), so nobody is signed out. */
export const clearLoginActivity = (): ApiCall<null> => httpClient.delete("/login-activity");
