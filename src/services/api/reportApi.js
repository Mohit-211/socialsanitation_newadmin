import httpClient from "@/services/httpClient";

// Reports (complaints) clients and employees send about a visit.

/**
 * Query: page, limit. Each: type, reason, status, reported_by (name, email),
 * booking (date, service, images: every photo of the visit) and images (the
 * photos sent with the report).
 */
export const listReports = (params) => httpClient.get("/reports", { params });

/** status: COMPLETED or PENDING. */
export const setReportStatus = (id, status) => httpClient.patch(`/reports/${id}`, { status });
