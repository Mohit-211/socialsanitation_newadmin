import type { Dayjs } from "dayjs";
import { addressLineOf } from "@/utils/format";
import type { ClientPick, Estimate } from "@/types";

/** The contract form's values. */
export interface ContractFormValues {
  user_id?: number;
  estimate_id?: number;
  client_company_name: string;
  client_legal_name: string;
  client_representative?: string | null;
  service_address?: string | null;
  total_monthly_price?: number | null;
  contract_date?: Dayjs | null;
}

/** What a contract takes from the chosen client: the parties and the address. */
export const contractFieldsFor = (client: ClientPick | null | undefined): Partial<ContractFormValues> =>
  client
    ? {
        client_company_name: client.name || "",
        client_legal_name: client.name || "",
        client_representative: client.name || "",
        service_address: addressLineOf(client),
      }
    : {};

/**
 * What a contract takes from the estimate it comes from, as the backend
 * drafts one when an estimate is signed: the company as both names, the
 * contact as the representative, and the address on one line.
 */
export const contractFieldsFromEstimate = (estimate: Estimate | null | undefined): Partial<ContractFormValues> => {
  if (!estimate) return {};
  const region = [estimate.state, estimate.zip].filter(Boolean).join(" ");
  const address = [estimate.address_line_1, estimate.address_line_2, estimate.city, region]
    .filter((part) => part && String(part).trim())
    .join(", ");
  return {
    ...(estimate.client_company_name
      ? { client_company_name: estimate.client_company_name, client_legal_name: estimate.client_company_name }
      : {}),
    ...(estimate.contact_name ? { client_representative: estimate.contact_name } : {}),
    ...(address ? { service_address: address } : {}),
  };
};
