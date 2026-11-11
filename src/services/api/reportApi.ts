import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Id, ListQuery, Paged, Report } from "@/types";

// Reports (complaints) clients and employees send about a visit.

/**
 * Query: page, limit. Each: type, reason, status, reported_by (name, email),
 * booking (date, service, images: every photo of the visit) and images (the
 * photos sent with the report).
 */
export const listReports = (params?: ListQuery): ApiCall<Paged<Report>> => httpClient.get("/reports", { params });

/** status: COMPLETED or PENDING. */
export const setReportStatus = (id: Id, status: "COMPLETED" | "PENDING"): ApiCall<Report> =>
  httpClient.patch(`/reports/${id}`, { status });
