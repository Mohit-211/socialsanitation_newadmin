import { useParams } from "react-router";

/**
 * A parameter of the current route, such as the :id of /edit-contract-agreement/:id.
 * The route's path names it, so it is there whenever the page shows.
 */
export function useRouteParam(name = "id"): string {
  return useParams()[name] ?? "";
}
