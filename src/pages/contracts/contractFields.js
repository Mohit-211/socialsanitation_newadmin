import { addressLineOf } from "@/utils/format";

/** What a contract takes from the chosen client: the parties and the address. */
export const contractFieldsFor = (client) =>
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
export const contractFieldsFromEstimate = (estimate) => {
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
