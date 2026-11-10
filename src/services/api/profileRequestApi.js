import httpClient from "@/services/httpClient";

// What clients ask the office to change about their account (name, email,
// phone, deleting it, or anything else): the app no longer edits it itself.

export const PROFILE_REQUEST_KINDS = Object.freeze([
  { value: "change_name", label: "Change of name" },
  { value: "change_email", label: "Change of email" },
  { value: "change_phone", label: "Change of phone" },
  { value: "delete_account", label: "Account deletion" },
  { value: "other", label: "Other" },
]);

export const PROFILE_REQUEST_STATUSES = Object.freeze([
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
  { value: "declined", label: "Declined" },
]);

/** Query: page, limit, status, kind, client_id. Each with kind_name, details, office_note and the client. */
export const listProfileRequests = (params) => httpClient.get("/profile-requests", { params });

/** status: done or declined (or open again), with a note the client sees. */
export const answerProfileRequest = (id, { status, note }) =>
  httpClient.patch(`/profile-requests/${id}`, { status, note: note || null });

/** Deletes the client's account for an account-deletion request. Needs records.delete. */
export const deleteAccountForRequest = (id) => httpClient.post(`/profile-requests/${id}/delete-account`);
