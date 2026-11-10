import httpClient from "@/services/httpClient";
import { API_BASE_URL } from "@/config/env";

// Invoices on /api/v2. Amounts are numbers; every invoice answers its state
// (draft, scheduled, sent, deposit_paid, overdue, paid or cancelled),
// contract_id, reminder_count and last_reminder_at.

/** quote_id, user_id or contract_id is required; a contract fills in the rest it can. */
export const createInvoice = (invoice) => httpClient.post("/invoices", invoice);

/** Emails it at once, whatever its schedule. */
export const sendInvoice = (id) => httpClient.post(`/invoices/${id}/send`);

/** An email with the Square link and a note in the app. */
export const remindInvoice = (id) => httpClient.post(`/invoices/${id}/remind`);

/** method: "CHECK" or "ACH". Closes the online link. */
export const markInvoicePaid = (id, method) => httpClient.post(`/invoices/${id}/mark-paid`, { method });

/** Needs records.delete. Closes any waiting payment link. */
export const deleteInvoice = (id) => httpClient.delete(`/invoices/${id}`);

/** What an invoice for the contract would hold, saving nothing. */
export const getContractInvoiceDraft = (contractId) => httpClient.get(`/contracts/${contractId}/invoice-draft`);

// ---------------------------------------------------------------------------
// Old /api/v1 calls, still used by the invoice screens until they move to
// /api/v2. They go once those screens move.

export const GetInvoices = async (month = null) => {
  try {
    const res = await httpClient.get(
      API_BASE_URL + `admin/user/invoices?month=${month}`,
    );

    return res;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

/**
 * Mark invoice as BOOKED
 */
export const MarkInvoiceBooked = async (id) => {
  try {
    const res = await httpClient.put(
      `${API_BASE_URL}admin/user/quotes/mark-booked/${id}`,
    );
    return res;
  } catch (error) {
    console.error("Error marking invoice as booked:", error);
    throw error;
  }
};

/**
 * Mark invoice as PAID BY CASH
 */
export const MarkInvoiceCheckPaid = async (id) => {
  try {
    const res = await httpClient.put(
      `${API_BASE_URL}admin/user/quotes/mark-check-paid/${id}`,
    );
    return res;
  } catch (error) {
    console.error("Error marking invoice as cash paid:", error);
    throw error;
  }
};

export const MarkInvoiceACHPaid = async (id) => {
  try {
    const res = await httpClient.put(
      `${API_BASE_URL}admin/user/quotes/mark-ach-paid/${id}`,
    );
    return res;
  } catch (error) {
    console.error("Error marking invoice as cash paid:", error);
    throw error;
  }
};

export const GetPaymentStatus = async (orderId) => {
  try {
    const res = await httpClient.get(API_BASE_URL + `payment/status/${orderId}`);
    return res;
  } catch (error) {
    console.error("Error fetching payment status:", error);
    throw error;
  }
};

//generate invoice api

export const CreateInvoice = async (formData) => {
  try {
    const res = await httpClient.post(API_BASE_URL + "invoice/createInvoice", formData);

    return res;
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
};

export const GetAllInvoices = async (month = null) => {
  try {
    const res = await httpClient.get(
      API_BASE_URL + `invoice/getAllInvoices?month=${month}`,
    );

    return res;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

export const GetNextInvoiceRef = async (ref_type) => {
  return httpClient.get(API_BASE_URL + `invoice/getNextInvoiceRef`, {
    params: { ref_type },
  });
};

export const DeleteInvoice = async (id) => {
  return httpClient.delete(`${API_BASE_URL}invoice/deleteInvoice/${id}`);
};

export const ImportInvoicesCSV = async (formData) => {
  return await httpClient.post(
    `${API_BASE_URL}invoice/import-historical-csv`,
    formData,
    {
      headers: {
        "x-access-token": localStorage.getItem("adminToken"),
      },
    },
  );
};

export const UploadHistoricalInvoicePDF = async (invoiceId, file) => {
  try {
    const formData = new FormData();
    formData.append("docs", file);

    return await httpClient.post(
      `${API_BASE_URL}invoice/${invoiceId}/upload-pdf`,
      formData,
      {
        headers: {
          "x-access-token": localStorage.getItem("adminToken"),
        },
      },
    );
  } catch (error) {
    console.error("Error uploading historical invoice PDF:", error);
    throw error;
  }
};

export const GetInvoiceById = async (id) => {
  try {
    return await httpClient.get(API_BASE_URL + `invoice/${id}`);
  } catch (error) {
    console.error("Get invoice error:", error);
    throw error;
  }
};

export const UpdateInvoice = async (id, payload) => {
  try {
    return await httpClient.put(API_BASE_URL + `invoice/${id}`, payload);
  } catch (error) {
    console.error("Update invoice error:", error);
    throw error;
  }
};

export const GetAllUserName = async () => {
  const res = await httpClient.get(API_BASE_URL + "admin/user/getAllUserName");
  return res;
};

export const GetUserAddressesByUserId = async (userId) => {
  const res = await httpClient.get(
    API_BASE_URL + `admin/user/getUserAddressesByUserId/${userId}`,
  );
  return res;
};

export const GetMonthlyInvoicesSummary = async (month = null) => {
  try {
    const res = await httpClient.post(
      API_BASE_URL + `admin/user/getMonthlyInvoicesSummary?month=${month}`,
    );

    return res;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

export const GetMonthlyAllInvoicesSummary = async (month = null) => {
  try {
    const res = await httpClient.post(
      API_BASE_URL + `invoice/getMonthlyAllInvoicesSummary?month=${month}`,
    );

    return res;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

export const MarkInvoicePaidByCheck = async (invoiceId) => {
  const res = await httpClient.patch(
    API_BASE_URL + `invoice/mark-paid-check/${invoiceId}`,
  );
  return res;
};

export const MarkInvoicePaidByACH = async (invoiceId) => {
  const res = await httpClient.patch(
    API_BASE_URL + `invoice/markInvoicePaidByACH/${invoiceId}`,
  );
  return res;
};

export const ReorderInvoiceItems = async (invoiceId, items) => {
  try {
    const res = await httpClient.patch(
      API_BASE_URL + `invoice/${invoiceId}/reorder-items`,
      {
        items,
      },
    );

    return res;
  } catch (error) {
    console.error("Error reordering invoice items:", error);
    throw error;
  }
};

export const SendInvoiceBalance = async (invoiceId) => {
  try {
    return await httpClient.post(`${API_BASE_URL}invoice/${invoiceId}/send-balance`);
  } catch (error) {
    console.error("Error sending invoice balance:", error);
    throw error;
  }
};
