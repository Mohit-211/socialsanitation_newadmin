import { listCountries } from "@/services/api/referenceApi";
import { itemsOf } from "@/services/apiResult";
import { useApiQuery } from "./useApiQuery";

/** The countries an address can be in (the US and Canada), for address forms. */
export const useCountries = () => useApiQuery(() => listCountries().then(itemsOf), [], { initial: [] });
