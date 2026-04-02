import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export interface PaginationState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface PaginationControls extends PaginationState {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSortBy: (col: string) => void;
  toggleSortOrder: () => void;
  totalPages: number;
  totalCount: number;
  setTotalCount: (n: number) => void;
  from: number;
  to: number;
}

const DEFAULT_PAGE_SIZE = 50;

/**
 * Hook that stores pagination state in URL search params.
 * prefix allows multiple paginated tables on same page.
 */
export function usePagination(
  prefix = "",
  defaults?: { sortBy?: string; sortOrder?: "asc" | "desc"; pageSize?: number }
): PaginationControls {
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalCount, setTotalCount] = useState(0);

  const p = prefix ? `${prefix}_` : "";

  const page = Math.max(1, parseInt(searchParams.get(`${p}page`) || "1", 10));
  const pageSize = parseInt(searchParams.get(`${p}size`) || String(defaults?.pageSize ?? DEFAULT_PAGE_SIZE), 10);
  const sortBy = searchParams.get(`${p}sort`) || defaults?.sortBy || "created_at";
  const sortOrder = (searchParams.get(`${p}order`) || defaults?.sortOrder || "desc") as "asc" | "desc";

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(key, value);
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const setPage = useCallback((n: number) => setParam(`${p}page`, String(n)), [setParam, p]);
  const setPageSize = useCallback((n: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(`${p}size`, String(n));
      next.set(`${p}page`, "1");
      return next;
    }, { replace: true });
  }, [setSearchParams, p]);

  const setSortBy = useCallback((col: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(`${p}sort`, col);
      next.set(`${p}page`, "1");
      return next;
    }, { replace: true });
  }, [setSearchParams, p]);

  const toggleSortOrder = useCallback(() => {
    setParam(`${p}order`, sortOrder === "asc" ? "desc" : "asc");
  }, [setParam, p, sortOrder]);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return {
    page, pageSize, sortBy, sortOrder,
    setPage, setPageSize, setSortBy, toggleSortOrder,
    totalPages, totalCount, setTotalCount,
    from, to,
  };
}
