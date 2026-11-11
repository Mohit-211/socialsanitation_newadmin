import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Contract, ContractInput, Id, ListQuery, Paged, Resent } from "@/types";

// Contract agreements. Each makes a PDF and goes to the client for signature
// by DocuSign; it is paid through its invoices. Share and Unshare live in
// documentApi.ts.

/** Query: page, limit, user_id, status, search (company). */
export const listContracts = (params?: ListQuery): ApiCall<Paged<Contract>> => httpClient.get("/contracts", { params });

/** One contract, with its signature. */
export const getContract = (id: Id): ApiCall<Contract> => httpClient.get(`/contracts/${id}`);

/**
 * user_id, client_company_name, client_legal_name and total_monthly_price
 * (more than 0) are required; also estimate_id, service_address,
 * client_representative, contract_date and signature.
 */
export const createContract = (contract: ContractInput): ApiCall<Contract> => httpClient.post("/contracts", contract);

/** The whole contract again, without user_id: a new link, PDF and envelope. */
export const updateContract = (id: Id, contract: ContractInput): ApiCall<Contract> =>
  httpClient.put(`/contracts/${id}`, contract);

/** Needs records.delete. */
export const deleteContract = (id: Id): ApiCall<null> => httpClient.delete(`/contracts/${id}`);

/** DocuSign emails the client again; data.sent_to says who. */
export const resendContract = (id: Id): ApiCall<Resent> => httpClient.post(`/contracts/${id}/resend`);
