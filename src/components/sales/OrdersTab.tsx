import { useState, useMemo, useEffect } from "react";
import { useOrders, type Order } from "@/hooks/useOrders";
import { useClients } from "@/hooks/useClients";
import { usePagination } from "@/hooks/usePaginatedQuery";
import { useDictOptions } from "@/hooks/useDictOptions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter, Package, User } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import TablePagination from "@/components/ui/table-pagination";
import OrderFormDialog from "./OrderFormDialog";

export default function OrdersTab() {
  const pg = usePagination("orders", { sortBy: "created_at", sortOrder: "desc" });
  const { orders, totalCount, isLoading } = useOrders({
    from: pg.from, to: pg.to, sortBy: pg.sortBy, sortOrder: pg.sortOrder,
  });
  const { clients } = useClients();
  const orderStatuses = useDictOptions("order_statuses");
  const orderTypes = useDictOptions("order_types");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  useEffect(() => { pg.setTotalCount(totalCount); }, [totalCount]);

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all") result = result.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.number.toLowerCase().includes(q) ||
          (o.client as any)?.name?.toLowerCase().includes(q) ||
          o.notes?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, search, statusFilter]);

  const formatAmount = (n: number) =>
    n > 0 ? new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n) : "—";

  const openNew = () => { setEditOrder(null); setDialogOpen(true); };
  const openEdit = (o: Order) => { setEditOrder(o); setDialogOpen(true); };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Загрузка заказов...</div>;

  const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const paidAmount = orders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);
  const activeOrders = orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length;

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Поиск по номеру, клиенту..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {orderStatuses.options.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Заказ
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Всего заказов", value: totalCount.toString() },
          { label: "Активных", value: activeOrders.toString() },
          { label: "Общая сумма", value: formatAmount(totalAmount) },
          { label: "Оплачено", value: formatAmount(paidAmount) },
        ].map((stat) => (
          <div key={stat.label} className="border border-border p-3 bg-card">
            <div className="text-2xl font-light">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center">
          <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {search || statusFilter !== "all" ? "Ничего не найдено" : "Заказов пока нет. Создайте первый заказ."}
          </p>
        </div>
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Оплата</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const si = orderStatuses.find(order.status);
                const balance = order.total_amount - order.paid_amount;
                return (
                  <TableRow key={order.id} className="cursor-pointer" onClick={() => openEdit(order)}>
                    <TableCell className="font-mono text-xs">{order.number || "—"}</TableCell>
                    <TableCell>
                      {order.client ? (
                        <span className="inline-flex items-center gap-1 text-sm">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {(order.client as any).name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{orderTypes.label(order.order_type)}</TableCell>
                    <TableCell className="font-medium text-sm">{formatAmount(order.total_amount)}</TableCell>
                    <TableCell>
                      {order.paid_amount > 0 ? (
                        <span className={`text-xs ${balance > 0 ? "text-amber-500" : "text-green-500"}`}>
                          {formatAmount(order.paid_amount)}
                          {balance > 0 && <span className="text-muted-foreground ml-1">(долг {formatAmount(balance)})</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Не оплачен</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" style={{ borderColor: si.color, color: si.color }} className="text-[10px]">
                        {si.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "d MMM", { locale: ru })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination pagination={pg} />
        </div>
      )}

      <OrderFormDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditOrder(null); }}
        order={editOrder}
        clients={clients}
      />
    </>
  );
}
