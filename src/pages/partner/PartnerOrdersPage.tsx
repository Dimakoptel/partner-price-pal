import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { usePartnerOrders } from "@/hooks/usePartnerOrders";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Factory, Truck } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useState } from "react";

const ORDER_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Черновик", variant: "outline" },
  confirmed: { label: "Подтверждён", variant: "default" },
  in_production: { label: "В производстве", variant: "secondary" },
  ready: { label: "Готов", variant: "default" },
  shipped: { label: "Отгружен", variant: "secondary" },
  delivered: { label: "Доставлен", variant: "default" },
  completed: { label: "Завершён", variant: "default" },
  cancelled: { label: "Отменён", variant: "destructive" },
  pending_approval: { label: "На согласовании", variant: "outline" },
};

const DELIVERY_LABELS: Record<string, string> = {
  self_pickup: "Самовывоз",
  delivery: "Доставка",
  transport_company: "ТК",
};

export default function PartnerOrdersPage() {
  const { orders, loading, getProductionForOrder } = usePartnerOrders();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Загрузка заказов...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-light tracking-tight">Мои заказы</h1>
              <p className="text-sm text-muted-foreground">Отслеживание статуса заказов и производства</p>
            </div>
          </div>
        </motion.div>

        {orders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Заказов пока нет</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const st = ORDER_STATUS_MAP[order.status] || { label: order.status, variant: "outline" as const };
              const productions = getProductionForOrder(order.id);
              const isExpanded = expandedOrder === order.id;
              const hasProduction = productions.length > 0;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border bg-card"
                >
                  {/* Order header */}
                  <button
                    className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium">{order.number}</span>
                        <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                        {order.tracking_number && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Truck className="w-3 h-3" /> {order.tracking_number}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{order.total_amount.toLocaleString("ru-RU")} ₽</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "dd.MM.yyyy", { locale: ru })}
                        </span>
                      </div>
                    </div>

                    {/* Quick production progress */}
                    {hasProduction && (
                      <div className="mt-3 flex items-center gap-3">
                        <Factory className="w-3.5 h-3.5 text-muted-foreground" />
                        {productions.map(po => (
                          <div key={po.id} className="flex-1 flex items-center gap-2">
                            <Progress value={po.progress} className="h-1.5 flex-1" />
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {po.completedStages}/{po.totalStages}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Payment info */}
                    {order.paid_amount > 0 && order.paid_amount < order.total_amount && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Оплачено: {order.paid_amount.toLocaleString("ru-RU")} ₽ из {order.total_amount.toLocaleString("ru-RU")} ₽
                      </div>
                    )}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-4">
                      {/* Order info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Доставка</div>
                          <div>{DELIVERY_LABELS[order.delivery_method || ""] || order.delivery_method || "—"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Дата доставки</div>
                          <div>{order.delivery_date ? format(new Date(order.delivery_date), "dd.MM.yyyy", { locale: ru }) : "—"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Оплата</div>
                          <div className={order.paid_amount >= order.total_amount ? "text-green-600" : "text-amber-600"}>
                            {order.paid_amount >= order.total_amount ? "Оплачен" : `${order.paid_amount.toLocaleString("ru-RU")} / ${order.total_amount.toLocaleString("ru-RU")} ₽`}
                          </div>
                        </div>
                        {order.tracking_number && (
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase">Трек-номер</div>
                            <div className="font-mono">{order.tracking_number}</div>
                          </div>
                        )}
                      </div>

                      {/* Production orders */}
                      {hasProduction && (
                        <div>
                          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Factory className="w-3.5 h-3.5" /> Производство
                          </h4>
                          {productions.map(po => (
                            <div key={po.id} className="border border-border p-3 mb-2">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {po.batch_number && <span className="font-mono text-xs">{po.batch_number}</span>}
                                  {po.statusName && (
                                    <Badge variant="outline" className="text-[10px]">{po.statusName}</Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {po.progress}% ({po.completedStages}/{po.totalStages} этапов)
                                </span>
                              </div>
                              <Progress value={po.progress} className="h-2 mb-3" />

                              {/* Stages */}
                              {po.stages.length > 0 && (
                                <div className="space-y-1">
                                  {po.stages.map(stage => {
                                    const isComplete = stage.status === "completed" || stage.status === "skipped";
                                    const isActive = stage.status === "in_progress";
                                    return (
                                      <div
                                        key={stage.id}
                                        className={`flex items-center gap-2 text-xs py-1 px-2 ${
                                          isActive ? "bg-primary/5 border border-primary/20" : ""
                                        }`}
                                      >
                                        <div className={`w-2 h-2 rounded-full ${
                                          isComplete ? "bg-green-500" :
                                          isActive ? "bg-primary animate-pulse" :
                                          "bg-muted-foreground/30"
                                        }`} />
                                        <span className={isComplete ? "text-muted-foreground line-through" : isActive ? "font-medium" : "text-muted-foreground"}>
                                          Этап {stage.sort_order + 1}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground ml-auto">
                                          {stage.status === "completed" ? "✓" :
                                           stage.status === "skipped" ? "пропущен" :
                                           stage.status === "in_progress" ? "в работе" : "ожидание"}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Dates */}
                              <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                                {po.planned_start && <span>План: {format(new Date(po.planned_start), "dd.MM", { locale: ru })} — {po.planned_finish ? format(new Date(po.planned_finish), "dd.MM", { locale: ru }) : "?"}</span>}
                                {po.actual_start && <span>Факт: {format(new Date(po.actual_start), "dd.MM", { locale: ru })} — {po.actual_finish ? format(new Date(po.actual_finish), "dd.MM", { locale: ru }) : "..."}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {order.notes && (
                        <div className="text-xs text-muted-foreground border-t border-border pt-2">
                          <span className="font-medium">Примечание:</span> {order.notes}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
