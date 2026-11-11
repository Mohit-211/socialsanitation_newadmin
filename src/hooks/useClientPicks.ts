import { listClientPicks } from "@/services/api/clientApi";
import { itemsOf } from "@/services/apiResult";
import { useApiQuery } from "./useApiQuery";

/** Every client as id, name, email, mobile and address, for document forms. */
export const useClientPicks = () =>
  useApiQuery(() => listClientPicks().then(itemsOf), [], { initial: [], errorText: "Couldn't load the clients" });
