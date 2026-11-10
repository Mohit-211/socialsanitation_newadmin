import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { message } from "antd";
import { errorMessage } from "@/services/apiResult";

/**
 * Loads something from the API when the component mounts and again whenever
 * `inputs` change (ids, page, filters). `load` returns a promise of the value
 * to keep: map the answer inside it, e.g.
 *
 *   const { data: admins, loading, reload } =
 *     useApiQuery(() => listAdmins().then(itemsOf), [], { initial: [] });
 *
 * A late answer for old inputs is ignored, and a failure shows the backend's
 * message. `setData` changes the kept value in place, after a local edit.
 */
export function useApiQuery(load, inputs = [], { initial = null, errorText, skip = false } = {}) {
  const [state, setState] = useState({ data: initial, loading: !skip, error: null });
  const [version, setVersion] = useState(0);
  const run = useEffectEvent(() => load());
  const notify = useEffectEvent((error) => message.error(errorMessage(error, errorText)));
  const key = JSON.stringify(inputs);

  useEffect(() => {
    if (skip) return undefined;
    let current = true;
    run().then(
      (data) => {
        if (current) setState({ data, loading: false, error: null });
      },
      (error) => {
        if (!current) return;
        setState((previous) => ({ ...previous, loading: false, error }));
        notify(error);
      },
    );
    return () => {
      current = false;
    };
  }, [key, version, skip]);

  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, loading: true }));
    setVersion((value) => value + 1);
  }, []);

  const setData = useCallback(
    (update) =>
      setState((previous) => ({
        ...previous,
        data: typeof update === "function" ? update(previous.data) : update,
      })),
    [],
  );

  return { ...state, reload, setData };
}
