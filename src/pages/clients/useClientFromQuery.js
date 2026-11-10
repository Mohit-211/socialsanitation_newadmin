import { useSearchParams } from "react-router";
import { clientPagePath } from "./clientFlow";

/**
 * The client a form was opened for from the client page (?clientId=12), and
 * where to go after saving: back to that client's tab, or `fallbackPath` when
 * the form was opened from its own list.
 */
export function useClientFromQuery(tab, fallbackPath) {
  const [params] = useSearchParams();
  const clientId = Number(params.get("clientId")) || undefined;
  return {
    clientId,
    fromClientPage: Boolean(clientId),
    returnPath: clientId ? clientPagePath(clientId, tab) : fallbackPath,
    backLabel: clientId ? "Back to Client" : null,
    params,
  };
}
