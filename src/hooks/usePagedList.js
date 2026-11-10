import { useMemo, useState } from "react";
import { pageOf } from "@/services/apiResult";
import { debounce } from "@/utils/debounce";
import { useApiQuery } from "./useApiQuery";

const EMPTY = { items: [], pagination: null };

/**
 * A list the backend pages: page, page size (at most 50), a search box and
 * filters. `load(query)` gets { page, limit, search, ...filters } and returns
 * the API call; spread `tableProps` on an antd Table.
 *
 *   const list = usePagedList((query) => listContracts(query));
 *   <Input value={list.searchText} onChange={(e) => list.setSearchText(e.target.value)} />
 *   <Table rowKey="id" columns={columns} {...list.tableProps} />
 */
export function usePagedList(load, { limit: initialLimit = 20, filters: initialFilters = {}, errorText } = {}) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState("");
  const [searchText, setSearchTextNow] = useState("");
  const [filters, setFilters] = useState(initialFilters);

  const applySearch = useMemo(
    () =>
      debounce((text) => {
        setSearch(text.trim());
        setPage(1);
      }, 350),
    [],
  );

  const query = { page, limit, ...(search ? { search } : {}), ...filters };
  const result = useApiQuery(() => load(query).then(pageOf), [query], { initial: EMPTY, errorText });
  const items = result.data?.items ?? [];
  const pagination = result.data?.pagination ?? null;

  const setSearchText = (text) => {
    setSearchTextNow(text);
    applySearch(text);
  };

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value === "" || value === null ? undefined : value }));
    setPage(1);
  };

  const tableProps = {
    dataSource: items,
    loading: result.loading,
    pagination: {
      current: page,
      pageSize: limit,
      total: pagination?.total ?? items.length,
      showSizeChanger: true,
      pageSizeOptions: [10, 20, 50],
      showTotal: (total) => `${total} in all`,
    },
    onChange: (next) => {
      if (next.pageSize !== limit) {
        setLimit(next.pageSize);
        setPage(1);
      } else {
        setPage(next.current);
      }
    },
  };

  return {
    items,
    pagination,
    loading: result.loading,
    reload: result.reload,
    setItems: (update) =>
      result.setData((current) => ({ ...current, items: typeof update === "function" ? update(current.items) : update })),
    searchText,
    setSearchText,
    filters,
    setFilter,
    tableProps,
  };
}
