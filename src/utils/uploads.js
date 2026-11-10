// What the API takes as a file (ss-backend shared/http/multer.js): up to 25 MB
// each, and only these kinds, which it checks by the file's extension.
export const MAX_UPLOAD_MB = 25;

const EXTENSIONS = {
  image: ["jpg", "jpeg", "png", "gif", "webp"],
  video: ["mp4", "mov"],
  pdf: ["pdf"],
};

/** A file picker's accept list for these kinds, such as acceptOf("image", "pdf"). */
export const acceptOf = (...kinds) =>
  kinds.flatMap((kind) => EXTENSIONS[kind].map((ext) => `.${ext}`)).join(",");

/** "image", "video" or "pdf" for a file the API takes; null for any other. */
export const uploadKindOf = (file) => {
  const ext = String(file?.name || "").split(".").pop().toLowerCase();
  return Object.keys(EXTENSIONS).find((kind) => EXTENSIONS[kind].includes(ext)) ?? null;
};
