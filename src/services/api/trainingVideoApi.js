import httpClient from "@/services/httpClient";

// Training videos the crew watch in the app: a title and a link.

/** data.items: id, title, video_link, created_at. */
export const listVideos = () => httpClient.get("/videos");

export const getVideo = (id) => httpClient.get(`/videos/${id}`);

/** title and video_link. */
export const createVideo = (video) => httpClient.post("/videos", video);

export const updateVideo = (id, changes) => httpClient.patch(`/videos/${id}`, changes);

export const deleteVideo = (id) => httpClient.delete(`/videos/${id}`);
