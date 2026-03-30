import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDictOptions } from "@/hooks/useDictOptions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckSquare, RotateCcw } from "lucide-react";

interface Props {
  selectedLeads: string[];
  onClearSelection: () => void;
  onSuccess: () => void;
}

export default function LeadBulkActions({ selectedLeads, onClearSelection, onSuccess }: Props) {
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);
  const leadStatuses = useDictOptions("lead_statuses");

  const handleAction = async () => {
    if (!action || selectedLeads.length === 0) return;

    setLoading(true);
    try {
      // Validate action is a known status code
      const isValidStatus = leadStatuses.options.some((s) => s.value === action);
      if (!isValidStatus) {
        toast.error("Неизвестный статус");
        return;
      }

      const { error } = await supabase
        .from("leads")
        .update({ status: action })
        .in("id", selectedLeads);
      if (error) throw error;

      toast.success(`Обновлено ${selectedLeads.length} лидов`);
      onClearSelection();
      setAction("");
      onSuccess();
    } catch (e: any) {
      toast.error("Ошибка: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (selectedLeads.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-accent/50 border border-border rounded-md mb-3">
      <CheckSquare className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium">
        Выбрано: {selectedLeads.length}
      </span>
      <Select value={action} onValueChange={setAction}>
        <SelectTrigger className="w-[200px] h-8 text-xs">
          <SelectValue placeholder="Действие..." />
        </SelectTrigger>
        <SelectContent>
          {leadStatuses.options.map((s) => (
            <SelectItem key={s.value} value={s.value}>Статус: {s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="default" onClick={handleAction} disabled={!action || loading} className="h-8 text-xs">
        {loading ? "..." : "Применить"}
      </Button>
      <Button size="sm" variant="ghost" onClick={onClearSelection} className="h-8 text-xs">
        <RotateCcw className="w-3 h-3 mr-1" /> Снять
      </Button>
    </div>
  );
}
