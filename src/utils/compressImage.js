import { cssVar } from "@/theme/antdTheme";

const toBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image encoding failed."))),
      type,
      quality,
    );
  });

/**
 * Shrinks an image in the browser with the native canvas APIs, so no
 * third-party package is needed (replaces browser-image-compression).
 * It scales the longest side down to `maxWidthOrHeight` and lowers the JPEG
 * quality step by step until the file fits `maxSizeMB`.
 * Returns the original file when compression would not make it smaller.
 */
export async function compressImage(
  file,
  { maxSizeMB = 1, maxWidthOrHeight = 1920, minQuality = 0.5 } = {},
) {
  if (!file?.type?.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidthOrHeight / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  // JPEG has no transparency, so flatten onto the page background color.
  context.fillStyle = cssVar("--color-bg");
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const maxBytes = maxSizeMB * 1024 * 1024;
  let quality = 0.9;
  let blob = await toBlob(canvas, "image/jpeg", quality);
  while (blob.size > maxBytes && quality > minQuality) {
    quality = Math.max(minQuality, quality - 0.1);
    blob = await toBlob(canvas, "image/jpeg", quality);
  }

  if (blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
