// The shape of every API answer, and the small types shared by the models.

/** A record's id. Route params arrive as text, so calls take either. */
export type Id = number | string;

/** Every answer: { success, status, message, data }. */
export interface Envelope<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/** A list the backend pages. */
export interface Paged<T> {
  items: T[];
  pagination: Pagination;
}

/** A whole list in one answer. */
export interface Items<T> {
  items: T[];
}

/** The usual list query; endpoints add their own filters. */
export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  [filter: string]: string | number | boolean | undefined | null;
}

/** An uploaded file or image: its stored name and where to open it. */
export interface UploadedFile {
  id: number;
  file_name: string;
  url: string;
}

/** A country, state or city as addresses carry it. */
export interface Place {
  id: number;
  name: string;
}

/** A country or state, with its two-letter code. */
export interface CodedPlace extends Place {
  code: string | null;
}

/** Someone named in an answer. */
export interface PersonRef {
  id: number;
  name: string | null;
  email?: string | null;
  phone?: string | null;
}

/** An option in a select. */
export interface Option<V extends string | number = string> {
  value: V;
  label: string;
}

/** A role on an account: its code and name. */
export interface Role {
  id?: number;
  code: string;
  name: string;
}

/** Created and updated times on most records. */
export interface Timestamps {
  created_at: string;
  updated_at?: string;
}

/** When a document was shared with the client app and sent. */
export interface Sharing {
  shared_at: string | null;
  sent_at: string | null;
}

/** The next reference number of a document type. */
export interface NextRef {
  ref_no: string;
  sequence: number;
}

/** Who DocuSign emailed again. */
export interface Resent {
  sent_to?: string | null;
}
