import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Id, ListQuery, Paged, Product, RestockRequest, RestockStatus } from "@/types";

// Supplies: products the crew can ask the office to restock. Lists come in
// data.items with data.pagination (limit 15 by default, up to 500).

/** Query: page, limit, search. Each: id, name, description, quantity, images, created_at. */
export const listProducts = (params?: ListQuery): ApiCall<Paged<Product>> => httpClient.get("/products", { params });

export const getProduct = (id: Id): ApiCall<Product> => httpClient.get(`/products/${id}`);

/** Multipart: name and quantity (required), description, images. */
export const createProduct = (formData: FormData): ApiCall<Product> => httpClient.post("/products", formData);

/** Multipart: name, description, quantity, images, remove_image_ids. */
export const updateProduct = (id: Id, formData: FormData): ApiCall<Product> => httpClient.patch(`/products/${id}`, formData);

/** Needs records.delete. */
export const deleteProduct = (id: Id): ApiCall<null> => httpClient.delete(`/products/${id}`);

/** Query: page, limit. Each with employee (name, email), product and images. */
export const listRestockRequests = (params?: ListQuery): ApiCall<Paged<RestockRequest>> =>
  httpClient.get("/product-requests", { params });

/** status: Pending, Approved or Rejected. */
export const answerRestockRequest = (id: Id, status: RestockStatus): ApiCall<Pick<RestockRequest, "id" | "status">> =>
  httpClient.patch(`/product-requests/${id}`, { status });
