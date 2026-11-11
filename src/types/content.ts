import type { CodedPlace, Place } from "./api";

// --- The blog --------------------------------------------------------------------------

export type BlogStatus = "draft" | "scheduled" | "published";

export interface BlogTerm {
  id: number;
  name: string;
  slug: string;
}

export interface BlogPostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  author_name: string | null;
  category: BlogTerm | null;
  tags: BlogTerm[];
  status: BlogStatus;
  first_published_at: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPost extends BlogPostSummary {
  body: string;
  seo_title: string | null;
  seo_description: string | null;
}

export interface BlogPostInput {
  title?: string;
  body?: string;
  slug?: string;
  excerpt?: string | null;
  cover_image?: string | null;
  category_id?: number | null;
  tag_ids?: number[];
  author_name?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

// --- What the website and apps send ------------------------------------------------------

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  reason: string | null;
  message: string;
  created_at: string;
}

export interface ReviewLinks {
  apple_review_link: string | null;
  google_review_link: string | null;
  booking_review_link: string | null;
}

// --- Chats --------------------------------------------------------------------------------

/** A one-to-one chat in the office's list. */
export interface Chat {
  id: number;
  user_type?: string;
  name: string | null;
  image_url?: string | null;
  last_message: string | null;
  last_message_time: string | number | null;
  unread_count: number;
}

export interface Group {
  id: string;
  name: string;
  is_team: boolean;
  created_at: string | number | null;
  last_message: string | null;
  last_message_time: string | number | null;
  last_message_by: string | null;
  unread_count: number;
}

/** Someone who can join a team, or is in one. */
export interface TeamParticipant {
  id: number;
  user_type: string;
  key: string;
  name: string;
  role: string | number | null;
  participant_type: "admin" | "employee" | string;
}

// --- Places ---------------------------------------------------------------------------------

export interface Country extends CodedPlace {
  states?: CodedPlace[];
}

export interface State extends CodedPlace {
  country?: CodedPlace | null;
  cities?: Place[];
}

export interface City extends Place {
  country?: CodedPlace | null;
  state?: CodedPlace | null;
}
