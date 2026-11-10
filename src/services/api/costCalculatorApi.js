import httpClient from "@/services/httpClient";

// The cost calculator prices a client's scope of work: the labor, equipment
// and chemicals it takes, then bids with margin, overhead, risk and
// commission. It stays in the office and never reaches the client.

/** Query: page, limit, search (property), client_id, scope_of_work_id. Each with custom_tasks. */
export const listCostCalculations = (params) => httpClient.get("/cost-calculations", { params });

/** One calculation, with its bids, newest first. */
export const getCostCalculation = (id) => httpClient.get(`/cost-calculations/${id}`);

/**
 * The starting counts for a client, from a scope of work (or a sheet, or the
 * client's newest sheet), saving nothing: estimated_sqft, the room, restroom,
 * stall, kitchen and trash can counts, walkaround_minutes, employee_count,
 * client_type and floor_mix.
 */
export const getCostCalculationDraft = ({ clientId, scopeId, sheetId }) =>
  httpClient.get("/cost-calculations/draft", {
    params: { client_id: clientId, scope_of_work_id: scopeId || undefined, client_sheet_id: sheetId || undefined },
  });

/**
 * client_id is required; also scope_of_work_id and client_sheet_id (both the
 * client's), property_name, the counts, employee_count, hourly_wage and
 * custom_tasks. Counts left out come from the scope and sheet.
 */
export const createCostCalculation = (calculation) => httpClient.post("/cost-calculations", calculation);

/** Needs records.delete. */
export const deleteCostCalculation = (id) => httpClient.delete(`/cost-calculations/${id}`);

/** profit_margin_percentage, overhead_percentage, risk_buffer_amount, commission_percentage. */
export const addCostCalculationBid = (id, bid) => httpClient.post(`/cost-calculations/${id}/bids`, bid);

/** data.items: id, client_type, item_type, minutes_per_unit. */
export const getCostCalculationSettings = (clientType) =>
  httpClient.get("/cost-calculation-settings", { params: { client_type: clientType } });

export const updateCostCalculationSetting = (id, minutesPerUnit) =>
  httpClient.patch(`/cost-calculation-settings/${id}`, { minutes_per_unit: minutesPerUnit });
