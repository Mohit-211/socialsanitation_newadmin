import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Id, ListQuery, Option, Paged, ProfileRequest } from "@/types";

// What clients ask the office to change about their account (name, email,
// phone, deleting it, or anything else): the app no longer edits it itself.

export const PROFILE_REQUEST_KINDS: Option[] = [
  { value: "change_name", label: "Change of name" },
  { value: "change_email", label: "Change of email" },
  { value: "change_phone", label: "Change of phone" },
  { value: "delete_account", label: "Account deletion" },
  { value: "other", label: "Other" },
];

export const PROFILE_REQUEST_STATUSES: Option<ProfileRequest["status"]>[] = [
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
  { value: "declined", label: "Declined" },
];

/** Query: page, limit, status, kind, client_id. Each with kind_name, details, office_note and the client. */
export const listProfileRequests = (params?: ListQuery): ApiCall<Paged<ProfileRequest>> =>
  httpClient.get("/profile-requests", { params });

/** status: done or declined (or open again), with a note the client sees. */
export const answerProfileRequest = (
  id: Id,
  { status, note }: { status: ProfileRequest["status"]; note?: string | null },
): ApiCall<ProfileRequest> => httpClient.patch(`/profile-requests/${id}`, { status, note: note || null });

/** Deletes the client's account for an account-deletion request. Needs records.delete. */
export const deleteAccountForRequest = (id: Id): ApiCall<ProfileRequest> =>
  httpClient.post(`/profile-requests/${id}/delete-account`);
