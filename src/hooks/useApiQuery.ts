import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { message } from "antd";
import { errorMessage } from "@/services/apiResult";

export interface ApiQueryOptions<T> {
  /** The value until the first answer (and while skipped). */
  initial?: T;
  /** The message when the call fails and the answer has none of its own. */
  errorText?: string;
  /** Don't call yet (an id isn't known). */
  skip?: boolean;
  /** Don't show failures: the screen shows `error` itself. */
  silent?: boolean;
}

export interface ApiQuery<T> {
  data: T;
  loading: boolean;
  error: unknown;
  /** Loads again with the same inputs. */
  reload: () => void;
  /** Changes the kept value in place, after a local edit. */
  setData: (update: T | ((previous: T) => T)) => void;
}

/**
 * Loads something from the API when the component mounts and again whenever
 * `inputs` change (ids, page, filters). `load` returns a promise of the value
 * to keep: map the answer inside it, e.g.
 *
 *   const { data: admins, loading, reload } =
 *     useApiQuery(() => listAdmins().then(itemsOf), [], { initial: [] });
 *
 * A late answer for old inputs is ignored, and a failure shows the backend's
 * message (unless `silent`: the screen shows `error` itself). Without
 * `initial`, data is null until the first answer.
 */
export function useApiQuery<T>(load: () => Promise<T>, inputs: unknown[], options: ApiQueryOptions<T> & { initial: T }): ApiQuery<T>;
export function useApiQuery<T>(load: () => Promise<T>, inputs?: unknown[], options?: ApiQueryOptions<T>): ApiQuery<T | null>;
export function useApiQuery<T>(
  load: () => Promise<T>,
  inputs: unknown[] = [],
  { initial = null as T, errorText, skip = false, silent = false }: ApiQueryOptions<T> = {},
): ApiQuery<T> {
  const [state, setState] = useState<{ data: T; loading: boolean; error: unknown }>({
    data: initial,
    loading: !skip,
    error: null,
  });
  const [version, setVersion] = useState(0);
  const run = useEffectEvent(() => load());
  const notify = useEffectEvent((error: unknown) => {
    if (!silent) message.error(errorMessage(error, errorText));
  });
  const key = JSON.stringify(inputs);

  useEffect(() => {
    if (skip) return undefined;
    let current = true;
    run().then(
      (data) => {
        if (current) setState({ data, loading: false, error: null });
      },
      (error: unknown) => {
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
    (update: T | ((previous: T) => T)) =>
      setState((previous) => ({
        ...previous,
        data: typeof update === "function" ? (update as (previous: T) => T)(previous.data) : update,
      })),
    [],
  );

  return { ...state, reload, setData };
}
