import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Id, Items, ReviewLinks, ServiceReview } from "@/types";

// Review links (shown to clients when asking for a review) and review emails.

/** One object: apple_review_link, google_review_link, booking_review_link. */
export const getReviewLinks = (): ApiCall<ReviewLinks> => httpClient.get("/review-links");

/** Any of apple_review_link, google_review_link, booking_review_link. */
export const saveReviewLinks = (links: Partial<ReviewLinks>): ApiCall<ReviewLinks> => httpClient.put("/review-links", links);

/** Emails the client the review links; 404 until the links are saved. */
export const sendReviewEmail = (clientId: Id): ApiCall<null> => httpClient.post(`/clients/${clientId}/review-email`);

/** A service's reviews; the writer is reviewer_name. */
export const listServiceReviews = (serviceId: Id): ApiCall<Items<ServiceReview>> =>
  httpClient.get(`/services/${serviceId}/reviews`);
