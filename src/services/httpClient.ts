import axios from "axios";
import { ADMIN_API_URL, AUTH_API_URL, WEB_API_URL } from "@/config/env";
import { clearSession, getToken } from "@/lib/session";

// The admin side of the API (/api/v2/admin): every module in src/services/api
// calls it with paths such as "/clients/12". Each request carries the admin's
// session token, and a 401 means the session ended, so the panel goes back to
// sign-in. A 403 is a refusal the screen shows as a message.
const httpClient = axios.create({ baseURL: ADMIN_API_URL });

httpClient.interceptors.request.use((config) => {
  const token = getToken();
  // Always set it here, over any value a caller passed.
  if (token) config.headers.set("x-access-token", token);
  else config.headers.delete("x-access-token");
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearSession();
      if (window.location.pathname.toLowerCase() !== "/login") {
        window.location.assign("/Login");
      }
    }
    return Promise.reject(error);
  },
);

/** Sign-in, one-time codes and password resets (/api/v2/auth). No token. */
export const authClient = axios.create({ baseURL: AUTH_API_URL });

/** Public lists such as countries, states and cities (/api/v2/web). */
export const webClient = axios.create({ baseURL: WEB_API_URL });

export default httpClient;
