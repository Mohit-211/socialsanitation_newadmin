import { useSyncExternalStore } from "react";
import type { Session, SessionUser, SignInAnswer } from "@/types";

// The signed-in admin: their session token, when it ends, and who they are.
// Roles and permissions from the sign-in answer decide what the panel shows;
// role numbers are gone. The token is an opaque string: store it as text and
// never decode it. Kept in localStorage so a reload stays signed in.

const STORAGE_KEY = "ss.session";
// Keys the old sign-in used; cleared so a stale token is never sent.
const OLD_KEYS = ["adminToken", "adminId", "roleId", "authorize"];

const listeners = new Set<() => void>();
let current: Session | null | undefined; // undefined until first read

const isLive = (session: Session | null | undefined): session is Session =>
  session != null &&
  Boolean(session.token) &&
  (!session.expires_at || new Date(session.expires_at).getTime() > Date.now());

function readStored(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(session: Session | null) {
  current = session;
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
    OLD_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Private mode or blocked storage: the session lives in memory only.
  }
  listeners.forEach((listener) => listener());
}

/** The current session, or null when signed out or expired. */
export function getSession(): Session | null {
  if (current === undefined) current = readStored();
  return isLive(current) ? current : null;
}

/** The token for the x-access-token header, or null. */
export const getToken = (): string | null => getSession()?.token ?? null;

/** Stores the answer of POST /auth/admin/login. */
export function saveSession({ token, expires_at, ...user }: SignInAnswer) {
  write({ token, expires_at, user });
}

/** Replaces who the admin is (after GET /profile), keeping the token. */
export function updateSessionUser(user: Partial<SessionUser>) {
  const session = getSession();
  if (session) write({ ...session, user: { ...session.user, ...user } });
}

export function clearSession() {
  write(null);
}

/** Whether the signed-in admin has a permission, such as "records.delete". */
export const hasPermission = (code: Permission) =>
  Boolean(getSession()?.user?.permissions?.includes(code));

/** Permission codes the backend checks (src/shared/constants/roles.js there). */
export const PERMISSION = Object.freeze({
  MANAGE_ADMINS: "admins.manage",
  DELETE_RECORDS: "records.delete",
  MANAGE_TEAMS: "teams.manage",
} as const);

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab signing in or out changes this one too.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      current = readStored();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The session for a component; it re-renders on sign-in, sign-out and profile changes. */
export const useSession = () => useSyncExternalStore(subscribe, getSession);

/** Whether the signed-in admin may do something; re-renders with the session. */
export function useCan(code: Permission) {
  const session = useSession();
  return Boolean(session?.user?.permissions?.includes(code));
}

/**
 * Whether the signed-in admin is a Super Admin. Some screens (estimates, the
 * calculator, BDMs) are for Super Admins; the Admin role runs day-to-day
 * operations without them. Use permissions for what the backend enforces.
 */
export function useIsSuperAdmin() {
  const session = useSession();
  return Boolean(session?.user?.roles?.some((role) => role.code === "super_admin"));
}
