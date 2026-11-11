import { statusTag } from "@/utils/format";
import type { BlogStatus } from "@/types";

export const POST_STATUSES: { value: BlogStatus; label: string; color: string }[] = [
  { value: "draft", label: "Draft", color: "default" },
  { value: "scheduled", label: "Scheduled", color: "cyan" },
  { value: "published", label: "Published", color: "green" },
];

export const postStatus = (code: string | null | undefined) => POST_STATUSES.find((status) => status.value === code) || statusTag(code);

/** A title as a slug: lower-case words joined by dashes. */
export const slugOf = (text: string | null | undefined) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
