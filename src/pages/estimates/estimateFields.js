// What an estimate takes from the chosen client: the company, the address
// and the contact.
export const estimateFieldsFor = (client) =>
  client
    ? {
        client_company_name: client.name || "",
        address_line_1: client.address?.address_1 || "",
        city: client.address?.city || "",
        state: client.address?.state || "",
        contact_name: client.name || "",
        contact_phone: client.mobile || "",
        contact_email: client.email || "",
      }
    : {};

/** Visit frequencies the estimate PDF commonly prints; any text is taken. */
export const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Bi-Weekly", "Monthly", "One-time"].map((value) => ({ value }));
