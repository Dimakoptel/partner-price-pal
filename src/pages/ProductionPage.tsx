import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Factory, Search, Filter, Clock, CheckCircle2, Pause, XCircle, PlayCircle, SkipForward, MessageSquare } from "lucide-react";
import { useProductionOrders, useProductionStages, useUpdateProductionStatus, useUpdateProductionStage, type ProductionOrder, type ProductionStage } from "@/hooks/useProductionOrders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useDictOptions } from "@/hooks/useDictOptions";

function StagesList({ productionOrderId }: { productionOrderId: string }) {
  const { data: stages, isLoading } = useProductionStages(productionOrderId);
  const updateStage = useUpdateProductionStage();
  const stageStatuses = useDictOptions("production_stage_status");
  const [notesStageId, setNotesStageId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  if (isLoading) return <p className="text-xs text-muted-foreground py-2">Загрузка этапов...</p>;
  if (!stages || stages.length === 0) return <p className="text-xs text-muted-foreground py-2">Этапы не определены</p>;

  // Resolve actual codes from semantic tags so the UI keeps working even
  // if an admin renames or replaces the dictionary codes.
  const activeCode = stageStatuses.codeByTag("active", "in_progress");
  const finalCode = stageStatuses.codeByTag("final", "completed");
  const skippedCode = stageStatuses.codeByTag("skipped", "skipped");

  const isFinalish = (status: string) =>
    stageStatuses.hasTag(status, "final") || stageStatuses.hasTag(status, "skipped");

  const handleStart = (stage: ProductionStage) => {
    updateStage.mutate({ id: stage.id, updates: { status: activeCode, actual_start: new Date().toISOString() } });
  };

  const handleComplete = (stage: ProductionStage) => {
    updateStage.mutate({ id: stage.id, updates: { status: finalCode, actual_end: new Date().toISOString() } });
  };

  const handleSkip = (stage: ProductionStage) => {
    updateStage.mutate({ id: stage.id, updates: { status: skippedCode, actual_end: new Date().toISOString() } });
  };

  const handleSaveNotes = (stageId: string) => {
    updateStage.mutate({ id: stageId, updates: { notes: noteText } });
    setNotesStageId(null);
    setNoteText("");
  };

  return (
    <div className="space-y-2">
      {stages.map((s, idx) => {
        const si = stageStatuses.find(s.status);
        const isInitial = stageStatuses.hasTag(s.status, "initial");
        const isActive = stageStatuses.hasTag(s.status, "active");
        const isDone = isFinalish(s.status);
        const isEditable = !isDone;
        const prevDone = idx === 0 || isFinalish(stages[idx - 1].status);

        return (
          <div key={s.id} className="border border-border rounded-md p-3 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{s.stage?.name || `Этап ${idx + 1}`}</p>
                <p className="text-xs text-muted-foreground">
                  {s.planned_start ? format(new Date(s.planned_start), "d MMM", { locale: ru }) : "—"} → {s.planned_end ? format(new Date(s.planned_end), "d MMM", { locale: ru }) : "—"}
                  {s.actual_start && <span className="ml-2 text-foreground">Факт: {format(new Date(s.actual_start), "d MMM HH:mm", { locale: ru })}</span>}
                </p>
              </div>
              <Badge variant="outline" style={{ borderColor: si.color, color: si.color }} className="text-[10px] shrink-0">
                {si.label}
              </Badge>
            </div>

            {s.notes && notesStageId !== s.id && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded p-1.5">{s.notes}</p>
            )}

            {notesStageId === s.id && (
              <div className="flex gap-2">
                <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} className="text-xs" placeholder="Заметка к этапу..." />
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleSaveNotes(s.id)}>Сохранить</Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setNotesStageId(null)}>Отмена</Button>
                </div>
              </div>
            )}

            {isEditable && (
              <div className="flex gap-1.5 flex-wrap">
                {isInitial && prevDone && (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleStart(s)} disabled={updateStage.isPending}>
                    <PlayCircle className="w-3 h-3" /> Начать
                  </Button>
                )}
                {isActive && (
                  <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={() => handleComplete(s)} disabled={updateStage.isPending}>
                    <CheckCircle2 className="w-3 h-3" /> Завершить
                  </Button>
                )}
                {!isDone && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => handleSkip(s)} disabled={updateStage.isPending}>
                    <SkipForward className="w-3 h-3" /> Пропустить
                  </Button>
                )}
                {notesStageId !== s.id && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => { setNotesStageId(s.id); setNoteText(s.notes || ""); }}>
                    <MessageSquare className="w-3 h-3" /> Заметка
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ProductionPage() {
  const { data: orders, isLoading } = useProductionOrders();
  const updateStatus = useUpdateProductionStatus();
  const prodStatuses = useDictOptions("production_order_status");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  const filtered = useMemo(() => {
    let result = orders || [];
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status?.code === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        o.batch_number?.toLowerCase().includes(q) || o.notes?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, search, statusFilter]);

  const statusInfo = (o: ProductionOrder) => {
    const code = o.status?.code || "";
    return prodStatuses.find(code);
  };

  const stats = useMemo(() => {
    const all = orders || [];
    return {
      total: all.length,
      inProgress: all.filter((o) => o.status?.code === "in_progress").length,
      planned: all.filter((o) => o.status?.code === "planned").length,
      completed: all.filter((o) => o.status?.code === "completed").length,
    };
  }, [orders]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-light text-foreground tracking-tight">Производство</h1>
          <p className="text-muted-foreground text-sm mt-2 mb-6">Управление производственными заказами</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Всего", value: stats.total },
            { label: "Запланировано", value: stats.planned },
            { label: "В работе", value: stats.inProgress },
            { label: "Завершено", value: stats.completed },
          ].map((s) => (
            <div key={s.label} className="border border-border p-3 bg-card">
              <div className="text-2xl font-light">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Поиск по номеру партии..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {prodStatuses.options.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-border p-12 text-center">
            <Factory className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {search || statusFilter !== "all" ? "Ничего не найдено" : "Производственных заказов пока нет. Создайте заказ продажи и передайте в производство."}
            </p>
          </div>
        ) : (
          <div className="border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Партия</TableHead>
                  <TableHead>Приоритет</TableHead>
                  <TableHead>План. начало</TableHead>
                  <TableHead>План. окончание</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Создан</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((po) => {
                  const si = statusInfo(po);
                  return (
                    <TableRow key={po.id} className="cursor-pointer" onClick={() => setSelectedOrder(po)}>
                      <TableCell className="font-mono text-xs">{po.batch_number || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={po.priority === "high" ? "destructive" : po.priority === "urgent" ? "destructive" : "outline"} className="text-[10px]">
                          {po.priority === "high" ? "Высокий" : po.priority === "urgent" ? "Срочный" : po.priority === "low" ? "Низкий" : "Обычный"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {po.planned_start ? format(new Date(po.planned_start), "d MMM", { locale: ru }) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {po.planned_finish ? format(new Date(po.planned_finish), "d MMM", { locale: ru }) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ borderColor: si.color, color: si.color }} className="text-[10px]">
                          {si.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(po.created_at), "d MMM", { locale: ru })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(v) => { if (!v) setSelectedOrder(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Производственный заказ {selectedOrder?.batch_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Приоритет</span>
                  <p>{selectedOrder.priority === "high" ? "Высокий" : selectedOrder.priority === "urgent" ? "Срочный" : "Обычный"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Статус</span>
                  <p>{selectedOrder.status?.name || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Плановое начало</span>
                  <p>{selectedOrder.planned_start ? format(new Date(selectedOrder.planned_start), "d MMMM yyyy", { locale: ru }) : "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Плановое окончание</span>
                  <p>{selectedOrder.planned_finish ? format(new Date(selectedOrder.planned_finish), "d MMMM yyyy", { locale: ru }) : "—"}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <span className="text-muted-foreground text-xs">Заметки</span>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status actions */}
              <Separator />
              <div className="flex gap-2 flex-wrap">
                {selectedOrder.status?.code === "planned" && (
                  <Button size="sm" onClick={() => { updateStatus.mutate({ productionOrderId: selectedOrder.id, statusCode: "in_progress" }); setSelectedOrder(null); }}>
                    <PlayCircle className="w-3.5 h-3.5 mr-1" /> Начать производство
                  </Button>
                )}
                {selectedOrder.status?.code === "in_progress" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => { updateStatus.mutate({ productionOrderId: selectedOrder.id, statusCode: "paused" }); setSelectedOrder(null); }}>
                      <Pause className="w-3.5 h-3.5 mr-1" /> Приостановить
                    </Button>
                    <Button size="sm" onClick={() => { updateStatus.mutate({ productionOrderId: selectedOrder.id, statusCode: "completed" }); setSelectedOrder(null); }}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Завершить
                    </Button>
                  </>
                )}
                {selectedOrder.status?.code === "paused" && (
                  <Button size="sm" onClick={() => { updateStatus.mutate({ productionOrderId: selectedOrder.id, statusCode: "in_progress" }); setSelectedOrder(null); }}>
                    <PlayCircle className="w-3.5 h-3.5 mr-1" /> Возобновить
                  </Button>
                )}
              </div>

              {/* Stages */}
              <Separator />
              <h3 className="text-sm font-medium">Этапы производства</h3>
              <StagesList productionOrderId={selectedOrder.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
