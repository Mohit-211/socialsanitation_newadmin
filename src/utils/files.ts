import { API_URL, IMAGE_BASE_URL } from "@/config/env";

// Links to files the API serves. Newer answers carry whole links (and private
// documents carry signed ones that expire); older fields give only a file name
// or a folder and a name, which these helpers turn into links.

const isAbsolute = (value: string) => /^(https?:|data:|blob:)/i.test(value);

/** An uploaded image: whole links pass through, bare names live under /api/v1/images. */
export function imageUrl(fileName: string | null | undefined): string {
  if (!fileName) return "";
  const value = String(fileName);
  return isAbsolute(value) ? value : `${IMAGE_BASE_URL}${value.replace(/^\/+/, "")}`;
}

/** A file named by its folder path (file_uri, such as "/uploads/inventory") and file name. */
export function uploadUrl(fileUri: string | null | undefined, fileName?: string | null): string {
  if (fileUri && isAbsolute(String(fileUri))) {
    return fileName ? `${String(fileUri).replace(/\/+$/, "")}/${fileName}` : String(fileUri);
  }
  const folder = fileUri ? `/${String(fileUri).replace(/^\/+|\/+$/g, "")}` : "";
  return fileName ? `${API_URL}${folder}/${fileName}` : `${API_URL}${folder}`;
}
