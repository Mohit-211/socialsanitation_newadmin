// Reading API answers. Every answer is { success, status, message, data };
// a list's data is { items, pagination: { page, limit, total, total_pages } }.

/** The data of an answer. */
export const dataOf = (response) => response?.data?.data;

/** A list answer as { items, pagination }, empty when the answer has none. */
export function pageOf(response) {
  const data = dataOf(response);
  if (Array.isArray(data)) return { items: data, pagination: null };
  return { items: data?.items ?? [], pagination: data?.pagination ?? null };
}

/** The items of a list answer. */
export const itemsOf = (response) => pageOf(response).items;

/** The message to show for a failed call: the backend's own when it sent one. */
export function errorMessage(error, fallback = "Something went wrong. Please try again.") {
  const message = error?.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error?.code === "ERR_NETWORK") return "Can't reach the server. Check your connection and try again.";
  return fallback;
}

/** antd Table pagination props for a list answer's pagination. */
export const tablePagination = (pagination, extra = {}) =>
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
