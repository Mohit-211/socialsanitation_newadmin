import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type {
  Estimate,
  EstimateDraft,
  EstimateInput,
  EstimateSummary,
  Id,
  Items,
  ListQuery,
  Paged,
  Resent,
  ScopeItem,
  ScopeSection,
} from "@/types";

// Service estimates. Each makes a PDF and goes to the client for signature by
// DocuSign. It is made from a scope of work (it keeps its own copy, which the
// office can edit) and priced from a cost calculation and one of its bids, as
// price lines the office can change. Share and Unshare live in documentApi.ts.

/** Query: page, limit, user_id, status, search (company). */
export const listEstimates = (params?: ListQuery): ApiCall<Paged<EstimateSummary>> =>
  httpClient.get("/estimates", { params });

/** One estimate, with its signature and scope_sections. */
export const getEstimate = (id: Id): ApiCall<Estimate> => httpClient.get(`/estimates/${id}`);

/**
 * What a new estimate starts from, saving nothing: the links, the company and
 * contact, the address of the scope's sheet (or the client's primary one), the
 * scope's visit frequency, and the price lines and total from the calculation
 * and bid (the newest bid when none is named).
 */
export const getEstimateDraft = ({
  clientId,
  scopeId,
  calculationId,
  bidId,
}: {
  clientId: Id;
  scopeId?: Id | null;
  calculationId?: Id | null;
  bidId?: Id | null;
}): ApiCall<EstimateDraft> =>
  httpClient.get("/estimates/draft", {
    params: { client_id: clientId, scope_of_work_id: scopeId, cost_calculation_id: calculationId, bid_id: bidId },
  });

/**
 * user_id and client_company_name are required, and its price: price_lines
 * (name, frequency, price, hours, personnel) or a cost_calculation_id. Also
 * scope_of_work_id, bid_id, the address, contact, signed_date, frequency and
 * signature.
 */
export const createEstimate = (estimate: EstimateInput): ApiCall<Estimate> => httpClient.post("/estimates", estimate);

/**
 * The whole estimate again (with user_id): a new PDF, sent for signature
 * again. Links left out stay; lines left out stay unless another calculation
 * or bid comes. Another scope replaces the estimate's copy of the scope.
 */
export const updateEstimate = (id: Id, estimate: EstimateInput): ApiCall<Estimate> =>
  httpClient.put(`/estimates/${id}`, estimate);

/** Needs records.delete. */
export const deleteEstimate = (id: Id): ApiCall<null> => httpClient.delete(`/estimates/${id}`);

/** DocuSign emails the client again; data.sent_to says who. */
export const resendEstimate = (id: Id): ApiCall<Resent> => httpClient.post(`/estimates/${id}/resend`);

// --- The estimate's own copy of the scope -------------------------------------

export interface SectionInput {
  title?: string;
  is_red?: boolean;
  order?: number;
}

export interface ItemInput {
  section_id?: Id;
  description?: string;
  is_daily?: boolean;
  is_weekly?: boolean;
  is_monthly?: boolean;
  order?: number;
}

/** data.items: the estimate's sections, each with its items. */
export const getEstimateScope = (id: Id): ApiCall<Items<ScopeSection>> => httpClient.get(`/estimates/${id}/scope`);

/** title (required), is_red. Answers the section. */
export const addEstimateSection = (id: Id, section: SectionInput): ApiCall<ScopeSection> =>
  httpClient.post(`/estimates/${id}/scope/sections`, section);

export const updateEstimateSection = (id: Id, sectionId: Id, changes: SectionInput): ApiCall<ScopeSection> =>
  httpClient.patch(`/estimates/${id}/scope/sections/${sectionId}`, changes);

/** Needs records.delete. */
export const deleteEstimateSection = (id: Id, sectionId: Id): ApiCall<null> =>
  httpClient.delete(`/estimates/${id}/scope/sections/${sectionId}`, { data: {} });

/** section_id and description (required), is_daily, is_weekly, is_monthly. Answers the line. */
export const addEstimateItem = (id: Id, item: ItemInput): ApiCall<ScopeItem> =>
  httpClient.post(`/estimates/${id}/scope/items`, item);

export const updateEstimateItem = (id: Id, itemId: Id, changes: ItemInput): ApiCall<ScopeItem> =>
  httpClient.patch(`/estimates/${id}/scope/items/${itemId}`, changes);

/** Needs records.delete. */
export const deleteEstimateItem = (id: Id, itemId: Id): ApiCall<null> =>
  httpClient.delete(`/estimates/${id}/scope/items/${itemId}`, { data: {} });
