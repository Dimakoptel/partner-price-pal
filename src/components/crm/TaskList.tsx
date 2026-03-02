import { useState } from "react";
import { useTasks, type Task } from "@/hooks/useTasks";
import { useClients } from "@/hooks/useClients";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, Trash2, AlertCircle } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ru } from "date-fns/locale";
import TaskFormDialog from "./TaskFormDialog";

interface Props {
  clientId?: string;
  dealId?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-destructive border-destructive/30",
  medium: "text-amber-600 border-amber-300",
  low: "text-muted-foreground border-border",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

export default function TaskList({ clientId, dealId }: Props) {
  const { tasks, isLoading, completeTask, deleteTask } = useTasks({ client_id: clientId, deal_id: dealId });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const isOverdue = (t: Task) => t.due_date && !t.completed_at && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date));

  const openNew = () => { setEditTask(null); setDialogOpen(true); };
  const openEdit = (t: Task) => { setEditTask(t); setDialogOpen(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Задачи ({activeTasks.length})</h3>
        <Button variant="outline" size="sm" onClick={openNew} className="gap-1.5 h-7 text-xs">
          <Plus className="w-3 h-3" /> Задача
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Загрузка...</p>
      ) : activeTasks.length === 0 && doneTasks.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Нет задач</p>
      ) : (
        <div className="space-y-1.5">
          {activeTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors ${
                isOverdue(task) ? "border-destructive/30 bg-destructive/5" : "border-border/50"
              }`}
              onClick={() => openEdit(task)}
            >
              <Checkbox
                checked={false}
                onClick={(e) => e.stopPropagation()}
                onCheckedChange={() => completeTask(task.id, true)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-tight">{task.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {task.due_date && (
                    <span className={`inline-flex items-center gap-1 text-[10px] ${isOverdue(task) ? "text-destructive" : "text-muted-foreground"}`}>
                      {isOverdue(task) && <AlertCircle className="w-3 h-3" />}
                      <Calendar className="w-3 h-3" />
                      {format(new Date(task.due_date), "d MMM", { locale: ru })}
                    </span>
                  )}
                  <Badge variant="outline" className={`text-[10px] h-4 px-1 ${PRIORITY_COLORS[task.priority]}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); deleteTask.mutate(task.id); }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}

          {doneTasks.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Выполнено ({doneTasks.length})</p>
              {doneTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center gap-2 p-1.5 text-muted-foreground">
                  <Checkbox
                    checked={true}
                    onCheckedChange={() => completeTask(task.id, false)}
                  />
                  <span className="text-xs line-through">{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditTask(null); }}
        task={editTask}
        clientId={clientId}
        dealId={dealId}
      />
    </div>
  );
}
