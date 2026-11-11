import { webClient } from "@/services/httpClient";
import type { ApiCall } from "@/services/apiResult";
import type { City, Country, Id, Paged, State } from "@/types";

// The places an address can be in: the United States (50 states and DC) and
// Canada. Public lists, shared with the website.

export const listCountries = (): ApiCall<Paged<Country>> => webClient.get("/countries", { params: { limit: 50 } });

/** The states or provinces of one country: id, name, code. */
export const listStates = ({ countryId, search }: { countryId?: Id | null; search?: string } = {}): ApiCall<Paged<State>> =>
  webClient.get("/states", { params: { country_id: countryId, search: search || undefined, limit: 100 } });

/** The cities of one state, filtered by the text typed. */
export const listCities = ({
  stateId,
  search,
  limit = 50,
}: { stateId?: Id | null; search?: string; limit?: number } = {}): ApiCall<Paged<City>> =>
  webClient.get("/cities", { params: { state_id: stateId, search: search || undefined, limit } });

export const getCity = (id: Id): ApiCall<City> => webClient.get(`/cities/${id}`);
