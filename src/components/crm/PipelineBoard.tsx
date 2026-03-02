import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useDeals, type Deal, type PipelineStage } from "@/hooks/useDeals";
import { useClients } from "@/hooks/useClients";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, User, DollarSign, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DealFormDialog from "./DealFormDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

export default function PipelineBoard() {
  const { stages, deals, isLoading, moveDeal, deleteDeal } = useDeals();
  const { clients } = useClients();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [presetStageId, setPresetStageId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const dealsByStage = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    stages.forEach((s) => (map[s.id] = []));
    deals.forEach((d) => {
      if (map[d.stage_id]) map[d.stage_id].push(d);
    });
    return map;
  }, [stages, deals]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const dealId = result.draggableId;
    const newStageId = result.destination.droppableId;
    if (result.source.droppableId !== newStageId) {
      moveDeal(dealId, newStageId);
    }
  };

  const openNew = (stageId?: string) => {
    setEditDeal(null);
    setPresetStageId(stageId || stages[0]?.id || null);
    setDialogOpen(true);
  };

  const openEdit = (deal: Deal) => {
    setEditDeal(deal);
    setPresetStageId(null);
    setDialogOpen(true);
  };

  const formatAmount = (n: number) =>
    n > 0 ? new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n) : "";

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Загрузка воронки...</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Воронка сделок</h2>
          <p className="text-xs text-muted-foreground">{deals.length} сделок</p>
        </div>
        <Button size="sm" onClick={() => openNew()} className="gap-1.5">
          <Plus className="w-4 h-4" /> Сделка
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
          {stages.map((stage) => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-shrink-0 w-[280px] rounded-xl border p-3 transition-colors ${
                    snapshot.isDraggingOver ? "bg-primary/5 border-primary/30" : "bg-secondary/30 border-border/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-sm font-medium">{stage.name}</span>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {dealsByStage[stage.id]?.length || 0}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openNew(stage.id)}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-2 min-h-[60px]">
                    {dealsByStage[stage.id]?.map((deal, idx) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={idx}>
                        {(prov, snap) => (
                          <Card
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className={`p-3 cursor-grab active:cursor-grabbing transition-shadow ${
                              snap.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
                            }`}
                            onClick={() => openEdit(deal)}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-sm font-medium leading-tight">{deal.title}</p>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(deal); }}>Редактировать</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(deal.id); }}>
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Удалить
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {deal.client && (
                              <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                                <User className="w-3 h-3" /> {(deal.client as any).name || "—"}
                              </div>
                            )}

                            {deal.amount > 0 && (
                              <div className="flex items-center gap-1 mt-1 text-xs font-medium text-primary">
                                <DollarSign className="w-3 h-3" /> {formatAmount(deal.amount)}
                              </div>
                            )}
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <DealFormDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditDeal(null); setPresetStageId(null); } }}
        deal={editDeal}
        presetStageId={presetStageId}
        stages={stages}
        clients={clients}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сделку?</AlertDialogTitle>
            <AlertDialogDescription>Сделка будет удалена без возможности восстановления.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteDeal.mutate(deleteId); setDeleteId(null); }}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
