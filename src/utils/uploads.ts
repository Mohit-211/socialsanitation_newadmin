// What the API takes as a file (ss-backend shared/http/multer.js): up to 25 MB
// each, and only these kinds, which it checks by the file's extension.
export const MAX_UPLOAD_MB = 25;

const EXTENSIONS = {
  image: ["jpg", "jpeg", "png", "gif", "webp"],
  video: ["mp4", "mov"],
  pdf: ["pdf"],
} satisfies Record<string, string[]>;

export type UploadKind = keyof typeof EXTENSIONS;

const KINDS = Object.keys(EXTENSIONS) as UploadKind[];

/** A file picker's accept list for these kinds, such as acceptOf("image", "pdf"). */
export const acceptOf = (...kinds: UploadKind[]): string =>
  kinds.flatMap((kind) => EXTENSIONS[kind].map((ext) => `.${ext}`)).join(",");

/** "image", "video" or "pdf" for a file the API takes; null for any other. */
export const uploadKindOf = (file: { name?: string } | null | undefined): UploadKind | null => {
  const ext = (String(file?.name || "").split(".").pop() ?? "").toLowerCase();
  return KINDS.find((kind) => EXTENSIONS[kind].includes(ext)) ?? null;
};
