// Public brand assets and links. They are the same in every environment, so
// they live here as constants rather than in .env.

/** Logo printed on quotes, invoices and service requests. */
export const COMPANY_LOGO_URL =
  "https://socialsanitation.com/wp-content/uploads/2022/12/New-Logo.jpg";

/**
 * The office's address, in the From block of quotes, invoices and service
 * requests. The backend's PDFs print the same (COMPANY.ADDRESS in its company.js).
 */
export const COMPANY_ADDRESS = {
  line1: "5302 56th Commerce Park Blvd",
  line2: "Tampa, FL 33610",
} as const;

/** Where clients are sent to leave a Google review after paying. */
export const GOOGLE_REVIEW_URL =
  "https://www.google.com/maps/place/Social+Sanitation+Commercial+Cleaning+Solutions";
