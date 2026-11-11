import { isAxiosError, type AxiosResponse } from "axios";
import type { TablePaginationConfig } from "antd";
import type { Envelope, Pagination, Paged } from "@/types";

// Reading API answers. Every answer is { success, status, message, data };
// a list's data is { items, pagination: { page, limit, total, total_pages } }.

/** An answer from httpClient: the envelope around T. */
export type ApiResponse<T> = AxiosResponse<Envelope<T>>;

/** A call to the API that answers T. */
export type ApiCall<T> = Promise<ApiResponse<T>>;

/** The data of an answer. */
export const dataOf = <T>(response: ApiResponse<T>): T => response?.data?.data;

/** A list answer's items: paged ({ items, pagination }), unpaged ({ items }) or a plain array. */
type ListData<T> = Paged<T> | { items: T[]; pagination?: Pagination | null } | T[] | null | undefined;

/** A list answer as { items, pagination }, empty when the answer has none. */
export function pageOf<T>(response: ApiResponse<ListData<T>>): { items: T[]; pagination: Pagination | null } {
  const data = dataOf(response);
  if (Array.isArray(data)) return { items: data, pagination: null };
  return { items: data?.items ?? [], pagination: data?.pagination ?? null };
}

/** The items of a list answer. */
export const itemsOf = <T>(response: ApiResponse<ListData<T>>): T[] => pageOf(response).items;

/** The message to show for a failed call: the backend's own when it sent one. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isAxiosError<{ message?: unknown }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
    if (error.code === "ERR_NETWORK") return "Can't reach the server. Check your connection and try again.";
  }
  return fallback;
}

/** antd Table pagination props for a list answer's pagination. */
export const tablePagination = (
  pagination: Pagination | null | undefined,
  extra: TablePaginationConfig = {},
): TablePaginationConfig | false =>
  pagination
    ? {
        current: pagination.page,
        pageSize: pagination.limit,
        total: pagination.total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50],
        ...extra,
      }
    : false;
