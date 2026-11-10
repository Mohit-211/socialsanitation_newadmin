import httpClient from "@/services/httpClient";

// The website's blog: posts (drafts, scheduled, published), their images,
// categories and tags.

/** Query: page, limit (≤ 50), search, status (draft, scheduled, published). Latest edit first; no body. */
export const listBlogPosts = (params) => httpClient.get("/blog-posts", { params });

/** The post with body and the SEO fields. */
export const getBlogPost = (id) => httpClient.get(`/blog-posts/${id}`);

/** title and body required; also slug, excerpt, cover_image, category_id, tag_ids, author_name, seo_title, seo_description. A new post is a draft. */
export const createBlogPost = (post) => httpClient.post("/blog-posts", post);

/** Any of those fields. tag_ids replaces the tags; a live post keeps its slug. */
export const updateBlogPost = (id, changes) => httpClient.patch(`/blog-posts/${id}`, changes);

/** Super Admin only. */
export const deleteBlogPost = (id) => httpClient.delete(`/blog-posts/${id}`);

/** Live now, or scheduled for a later publishedAt (an ISO date). */
export const publishBlogPost = (id, publishedAt) =>
  httpClient.post(`/blog-posts/${id}/publish`, publishedAt ? { published_at: publishedAt } : {});

/** Back to a draft, off the website. */
export const unpublishBlogPost = (id) => httpClient.post(`/blog-posts/${id}/unpublish`);

/** Up to 10 images of up to 10 MB: data.items with file_name and url (for cover_image and <img>). */
export const uploadBlogImages = (files) => {
  const form = new FormData();
  for (const file of files) form.append("images", file);
  return httpClient.post("/blog-images", form);
};

// Categories and tags: the same four calls each.
const taxonomy = (path) => ({
  list: () => httpClient.get(path),
  create: (name) => httpClient.post(path, { name }),
  rename: (id, name) => httpClient.patch(`${path}/${id}`, { name }),
  remove: (id) => httpClient.delete(`${path}/${id}`),
});

/** A rename keeps the slug; deleting leaves its posts without a category. */
export const blogCategories = taxonomy("/blog-categories");

/** Deleting a tag takes it off its posts. */
export const blogTags = taxonomy("/blog-tags");
