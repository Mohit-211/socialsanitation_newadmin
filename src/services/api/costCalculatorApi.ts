import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type {
  Bid,
  CalculationDraft,
  CalculationSetting,
  CalculationTask,
  ClientType,
  CostCalculation,
  Id,
  Items,
  ListQuery,
  Paged,
  SettingClientType,
} from "@/types";

// The cost calculator prices a client's scope of work: the labor, equipment
// and chemicals it takes, then bids with margin, overhead, risk and
// commission. It stays in the office and never reaches the client.

/** Query: page, limit, search (property), client_id, scope_of_work_id. Each with custom_tasks. */
export const listCostCalculations = (params?: ListQuery): ApiCall<Paged<CostCalculation>> =>
  httpClient.get("/cost-calculations", { params });

/** One calculation, with its bids, newest first. */
export const getCostCalculation = (id: Id): ApiCall<CostCalculation> => httpClient.get(`/cost-calculations/${id}`);

/**
 * The starting counts for a client, from a scope of work (or a sheet, or the
 * client's newest sheet), saving nothing: estimated_sqft, the room, restroom,
 * stall, kitchen and trash can counts, walkaround_minutes, employee_count,
 * client_type and floor_mix.
 */
export const getCostCalculationDraft = ({
  clientId,
  scopeId,
  sheetId,
}: {
  clientId: Id;
  scopeId?: Id | null;
  sheetId?: Id | null;
}): ApiCall<CalculationDraft> =>
  httpClient.get("/cost-calculations/draft", {
    params: { client_id: clientId, scope_of_work_id: scopeId || undefined, client_sheet_id: sheetId || undefined },
  });

export interface CalculationInput {
  client_id: Id;
  scope_of_work_id?: Id | null;
  client_sheet_id?: Id | null;
  property_name?: string;
  estimated_sqft?: number | null;
  room_count?: number | null;
  restroom_count?: number | null;
  stall_count?: number | null;
  kitchen_count?: number | null;
  trash_can_count?: number | null;
  walkaround_minutes?: number | null;
  employee_count?: number | null;
  hourly_wage?: number | null;
  custom_tasks?: Partial<CalculationTask>[];
}

/**
 * client_id is required; also scope_of_work_id and client_sheet_id (both the
 * client's), property_name, the counts, employee_count, hourly_wage and
 * custom_tasks. Counts left out come from the scope and sheet.
 */
export const createCostCalculation = (calculation: CalculationInput): ApiCall<CostCalculation> =>
  httpClient.post("/cost-calculations", calculation);

/** Needs records.delete. */
export const deleteCostCalculation = (id: Id): ApiCall<null> => httpClient.delete(`/cost-calculations/${id}`);

export interface BidInput {
  profit_margin_percentage: number;
  overhead_percentage: number;
  risk_buffer_amount: number;
  commission_percentage: number;
}

/** profit_margin_percentage, overhead_percentage, risk_buffer_amount, commission_percentage. */
export const addCostCalculationBid = (id: Id, bid: BidInput): ApiCall<Bid> =>
  httpClient.post(`/cost-calculations/${id}/bids`, bid);

/** data.items: id, client_type, item_type, minutes_per_unit. The client type matches in either case. */
export const getCostCalculationSettings = (
  clientType: ClientType | SettingClientType,
): ApiCall<Items<CalculationSetting>> =>
  httpClient.get("/cost-calculation-settings", { params: { client_type: clientType } });

export const updateCostCalculationSetting = (id: Id, minutesPerUnit: number): ApiCall<CalculationSetting> =>
  httpClient.patch(`/cost-calculation-settings/${id}`, { minutes_per_unit: minutesPerUnit });
