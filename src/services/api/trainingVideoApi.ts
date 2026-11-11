import httpClient from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { Id, Items, TrainingVideo } from "@/types";

// Training videos the crew watch in the app: a title and a link.

/** data.items: id, title, video_link, created_at. */
export const listVideos = (): ApiCall<Items<TrainingVideo>> => httpClient.get("/videos");

export const getVideo = (id: Id): ApiCall<TrainingVideo> => httpClient.get(`/videos/${id}`);

/** title and video_link. */
export const createVideo = (video: { title: string; video_link: string }): ApiCall<TrainingVideo> =>
  httpClient.post("/videos", video);

export const updateVideo = (id: Id, changes: Partial<{ title: string; video_link: string }>): ApiCall<TrainingVideo> =>
  httpClient.patch(`/videos/${id}`, changes);

export const deleteVideo = (id: Id): ApiCall<null> => httpClient.delete(`/videos/${id}`);
