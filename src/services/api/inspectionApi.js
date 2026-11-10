import httpClient from "@/services/httpClient";

// Inspections: a BDM's walk through a client's scope of work with an
// employee. The employee ticks items in the app; the office reviews each item
// and section, completes the inspection and sends it to the client.

/** data.items: the client's inspections, each with the client and employee. */
export const listClientInspections = (userId) => httpClient.get("/inspections", { params: { user_id: userId } });

/** user_id, employee_id and inspection_date (YYYY-MM-DD), all required. */
export const createInspection = (inspection) => httpClient.post("/inspections", inspection);

/** One inspection, with its items (and their images), section_reviews and summary. */
export const getInspection = (id) => httpClient.get(`/inspections/${id}`);

/** Needs records.delete. */
export const deleteInspection = (id) => httpClient.delete(`/inspections/${id}`);

/** remark: why it opens again. */
export const reopenInspection = (id, { remark }) => httpClient.post(`/inspections/${id}/reopen`, { remark });

/** bdm_status (required), bdm_remark. */
export const reviewInspectionItem = (itemId, review) => httpClient.patch(`/inspection-items/${itemId}/review`, review);

/** status (required), remark. */
export const reviewInspectionSection = (sectionReviewId, review) =>
  httpClient.patch(`/inspection-sections/${sectionReviewId}/review`, review);

/** Photos the reviewer adds to an item. */
export const addInspectionItemImages = (itemId, files) => {
  const form = new FormData();
  const list = Array.isArray(files) || files instanceof FileList ? Array.from(files) : [files];
  for (const file of list) form.append("images", file.originFileObj || file);
  return httpClient.post(`/inspection-items/${itemId}/images`, form);
};

/** overall_remark; the score comes from the finished items. */
export const completeInspection = (id, { overall_remark }) =>
  httpClient.post(`/inspections/${id}/complete`, { overall_remark });

export const sendInspectionToClient = (id) => httpClient.post(`/inspections/${id}/send-to-client`);
