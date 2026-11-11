import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type {
  Id,
  Inspection,
  InspectionDetail,
  InspectionItem,
  InspectionItemImage,
  InspectionReviewStatus,
  InspectionSectionReview,
  InspectionSummary,
  Items,
} from "@/types";

// Inspections: a BDM's walk through a client's scope of work with an
// employee. The employee ticks items in the app; the office reviews each item
// and section, completes the inspection and sends it to the client.

/** data.items: the client's inspections, each with the client and employee. */
export const listClientInspections = (userId: Id): ApiCall<Items<InspectionSummary>> =>
  httpClient.get("/inspections", { params: { user_id: userId } });

/** user_id, employee_id and inspection_date (YYYY-MM-DD), all required. */
export const createInspection = (inspection: {
  user_id: Id;
  employee_id: Id;
  inspection_date: string;
}): ApiCall<Inspection & { items: InspectionItem[] }> =>
  httpClient.post("/inspections", inspection);

/** One inspection, with its items (and their images), section_reviews and summary. */
export const getInspection = (id: Id): ApiCall<InspectionDetail> => httpClient.get(`/inspections/${id}`);

/** Needs records.delete. */
export const deleteInspection = (id: Id): ApiCall<null> => httpClient.delete(`/inspections/${id}`);

/** remark: why it opens again. */
export const reopenInspection = (id: Id, { remark }: { remark: string }): ApiCall<Inspection> =>
  httpClient.post(`/inspections/${id}/reopen`, { remark });

/** bdm_status (required), bdm_remark. */
export const reviewInspectionItem = (
  itemId: Id,
  review: { bdm_status: InspectionReviewStatus; bdm_remark?: string },
): ApiCall<Omit<InspectionItem, "images">> =>
  httpClient.patch(`/inspection-items/${itemId}/review`, review);

/** status (required), remark. */
export const reviewInspectionSection = (
  sectionReviewId: Id,
  review: { status: InspectionReviewStatus; remark?: string },
): ApiCall<InspectionSectionReview> =>
  httpClient.patch(`/inspection-sections/${sectionReviewId}/review`, review);

/** A file picked in an antd Upload, or a plain File. */
type Picked = File | { originFileObj?: File };

/** Photos the reviewer adds to an item. */
export const addInspectionItemImages = (itemId: Id, files: Picked | Picked[] | FileList): ApiCall<Items<InspectionItemImage>> => {
  const form = new FormData();
  const list: Picked[] = Array.isArray(files) || files instanceof FileList ? Array.from(files) : [files];
  for (const file of list) {
    const blob = file instanceof File ? file : file.originFileObj;
    if (blob) form.append("images", blob);
  }
  return httpClient.post(`/inspection-items/${itemId}/images`, form);
};

/** overall_remark; the score comes from the finished items. */
export const completeInspection = (id: Id, { overall_remark }: { overall_remark?: string }): ApiCall<Inspection> =>
  httpClient.post(`/inspections/${id}/complete`, { overall_remark });

export const sendInspectionToClient = (
  id: Id,
): ApiCall<Pick<Inspection, "id" | "client_email_sent" | "client_email_sent_at">> =>
  httpClient.post(`/inspections/${id}/send-to-client`);
