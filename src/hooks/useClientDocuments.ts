import { useApiQuery } from "@/hooks/useApiQuery";
import { getClientFlow } from "@/services/api/clientApi";
import { dataOf } from "@/services/apiResult";
import type { Id } from "@/types";

/**
 * A client's documents as short rows (the client page's lists): estimates,
 * quotes, service requests and contracts, each with its id, title, status
 * and the links between them. Null until a client is chosen.
 */
export function useClientDocuments(clientId: Id | null | undefined) {
  return useApiQuery(() => getClientFlow(clientId as Id).then(dataOf), [clientId], {
    initial: null,
    skip: !clientId,
    silent: true,
  });
}
