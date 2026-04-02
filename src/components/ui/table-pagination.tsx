import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { PaginationControls } from "@/hooks/usePaginatedQuery";

interface Props {
  pagination: PaginationControls;
  pageSizeOptions?: number[];
}

export default function TablePagination({ pagination, pageSizeOptions = [25, 50, 100] }: Props) {
  const { page, pageSize, totalPages, totalCount, setPage, setPageSize } = pagination;

  if (totalCount <= 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  // Generate page numbers to show
  const pages: (number | "...")[] = [];
  const addPage = (n: number) => { if (n >= 1 && n <= totalPages && !pages.includes(n)) pages.push(n); };
  addPage(1);
  if (page > 3) pages.push("...");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) addPage(i);
  if (page < totalPages - 2) pages.push("...");
  if (totalPages > 1) addPage(totalPages);

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-1 flex-wrap">
      <span className="text-xs text-muted-foreground">
        {from}–{to} из {totalCount}
      </span>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(1)}>
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="w-7 text-center text-xs text-muted-foreground">…</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="icon"
              className="h-7 w-7 text-xs"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          )
        )}

        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
        <SelectTrigger className="w-[80px] h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {pageSizeOptions.map((s) => (
            <SelectItem key={s} value={String(s)}>{s} / стр</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
