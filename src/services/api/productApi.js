import httpClient from "@/services/httpClient";

// Supplies: products the crew can ask the office to restock. Lists come in
// data.items with data.pagination (limit 15 by default, up to 500).

/** Query: page, limit, search. Each: id, name, description, quantity, images, created_at. */
export const listProducts = (params) => httpClient.get("/products", { params });

export const getProduct = (id) => httpClient.get(`/products/${id}`);

/** Multipart: name and quantity (required), description, images. */
export const createProduct = (formData) => httpClient.post("/products", formData);

/** Multipart: name, description, quantity, images, remove_image_ids. */
export const updateProduct = (id, formData) => httpClient.patch(`/products/${id}`, formData);

/** Needs records.delete. */
export const deleteProduct = (id) => httpClient.delete(`/products/${id}`);

/** Query: page, limit. Each with employee (name, email), product and images. */
export const listRestockRequests = (params) => httpClient.get("/product-requests", { params });

/** status: Pending, Approved or Rejected. */
export const answerRestockRequest = (id, status) => httpClient.patch(`/product-requests/${id}`, { status });
