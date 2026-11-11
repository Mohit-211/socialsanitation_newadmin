import { webClient } from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { PaymentStatusAnswer } from "@/types";

// Card payments through Square, on the public /api/v2/web side: the page a
// client lands on after paying an invoice's link asks how the payment went.

/** payment_status (PENDING, SUCCESS, REJECTED or REFUNDED), amount, currency and receipt_url. 404 if unknown. */
export const getPaymentStatus = (transactionId: string): ApiCall<PaymentStatusAnswer> =>
  webClient.get(`/payment-status/${encodeURIComponent(transactionId)}`);
