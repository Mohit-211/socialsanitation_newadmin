import httpClient from "@/services/httpClient";

// Contract agreements. Each makes a PDF and goes to the client for signature
// by DocuSign; it is paid through its invoices. Share and Unshare live in
// documentApi.js.

/** Query: page, limit, user_id, status, search (company). */
export const listContracts = (params) => httpClient.get("/contracts", { params });

/** One contract, with its signature. */
export const getContract = (id) => httpClient.get(`/contracts/${id}`);

/**
 * user_id, client_company_name, client_legal_name and total_monthly_price
 * (more than 0) are required; also service_address, client_representative,
 * contract_date and signature.
 */
export const createContract = (contract) => httpClient.post("/contracts", contract);

/** The whole contract again, without user_id: a new link, PDF and envelope. */
export const updateContract = (id, contract) => httpClient.put(`/contracts/${id}`, contract);

/** Needs records.delete. */
export const deleteContract = (id) => httpClient.delete(`/contracts/${id}`);

/** DocuSign emails the client again; data.sent_to says who. */
export const resendContract = (id) => httpClient.post(`/contracts/${id}/resend`);
