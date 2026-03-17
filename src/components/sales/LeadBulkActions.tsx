import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

  const handleAction = async () => {
    if (!action || selectedLeads.length === 0) return;

    setLoading(true);
    try {
      const updates: Record<string, string> = {};
      if (["new", "qualified", "proposal_sent", "negotiation", "won", "lost"].includes(action)) {
        updates.status = action;
      }

      const { error } = await supabase
        .from("leads")
        .update(updates as any)
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
          <SelectItem value="new">Статус: Новый</SelectItem>
          <SelectItem value="qualified">Статус: Квалифицирован</SelectItem>
          <SelectItem value="proposal_sent">Статус: КП отправлено</SelectItem>
          <SelectItem value="negotiation">Статус: Переговоры</SelectItem>
          <SelectItem value="won">Статус: Выигран</SelectItem>
          <SelectItem value="lost">Статус: Проигран</SelectItem>
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
