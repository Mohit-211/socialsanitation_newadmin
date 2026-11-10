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
