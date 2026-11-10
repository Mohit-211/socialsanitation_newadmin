import { webClient } from "@/services/httpClient";

// The places an address can be in: the United States (50 states and DC) and
// Canada. Public lists, shared with the website.

export const listCountries = () => webClient.get("/countries", { params: { limit: 50 } });

/** The states or provinces of one country: id, name, code. */
export const listStates = ({ countryId, search } = {}) =>
  webClient.get("/states", { params: { country_id: countryId, search: search || undefined, limit: 100 } });

/** The cities of one state, filtered by the text typed. */
export const listCities = ({ stateId, search, limit = 50 } = {}) =>
  webClient.get("/cities", { params: { state_id: stateId, search: search || undefined, limit } });

export const getCity = (id) => webClient.get(`/cities/${id}`);
