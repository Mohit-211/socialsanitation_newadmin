import { useMemo, useState } from "react";
import type { TablePaginationConfig, TableProps } from "antd";
import { pageOf, type ApiCall } from "@/services/apiResult";
import { debounce } from "@/utils/debounce";
import type { ListQuery, Paged, Pagination } from "@/types";
import { useApiQuery } from "./useApiQuery";

type Page<T> = { items: T[]; pagination: Pagination | null };
type Filters = Record<string, string | number | boolean | undefined>;

export interface PagedListOptions {
  limit?: number;
  filters?: Filters;
  errorText?: string;
}

/**
 * A list the backend pages: page, page size (at most 50), a search box and
 * filters. `load(query)` gets { page, limit, search, ...filters } and returns
 * the API call; spread `tableProps` on an antd Table.
 *
 *   const list = usePagedList((query) => listContracts(query));
 *   <Input value={list.searchText} onChange={(e) => list.setSearchText(e.target.value)} />
 *   <Table rowKey="id" columns={columns} {...list.tableProps} />
 */
export function usePagedList<T>(
  load: (query: ListQuery) => ApiCall<Paged<T> | T[]>,
  { limit: initialLimit = 20, filters: initialFilters = {}, errorText }: PagedListOptions = {},
) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState("");
  const [searchText, setSearchTextNow] = useState("");
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const applySearch = useMemo(
    () =>
      debounce((text: string) => {
        setSearch(text.trim());
        setPage(1);
      }, 350),
    [],
  );

  const query: ListQuery = { page, limit, ...(search ? { search } : {}), ...filters };
  const empty: Page<T> = { items: [], pagination: null };
  const result = useApiQuery<Page<T>>(() => load(query).then(pageOf), [query], { initial: empty, errorText });
  const items = result.data?.items ?? [];
  const pagination = result.data?.pagination ?? null;

  const setSearchText = (text: string) => {
    setSearchTextNow(text);
    applySearch(text);
  };

  const setFilter = (key: string, value: string | number | boolean | null | undefined) => {
    setFilters((current) => ({ ...current, [key]: value === "" || value === null ? undefined : value }));
    setPage(1);
  };

  const tableProps: Pick<TableProps<T>, "dataSource" | "loading" | "pagination" | "onChange"> = {
    dataSource: items,
    loading: result.loading,
    pagination: {
      current: page,
      pageSize: limit,
      total: pagination?.total ?? items.length,
      showSizeChanger: true,
      pageSizeOptions: [10, 20, 50],
      showTotal: (total: number) => `${total} in all`,
    },
    onChange: (next: TablePaginationConfig) => {
      if (next.pageSize && next.pageSize !== limit) {
        setLimit(next.pageSize);
        setPage(1);
      } else {
        setPage(next.current ?? 1);
      }
    },
  };

  return {
    items,
    pagination,
    loading: result.loading,
    reload: result.reload,
    setItems: (update: T[] | ((current: T[]) => T[])) =>
      result.setData((current) => ({
        ...current,
        items: typeof update === "function" ? update(current.items) : update,
      })),
    searchText,
    setSearchText,
    filters,
    setFilter,
    tableProps,
  };
}
