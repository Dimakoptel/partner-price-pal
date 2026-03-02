import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeals, type Deal, type PipelineStage } from "@/hooks/useDeals";
import type { Client } from "@/hooks/useClients";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  presetStageId?: string | null;
  stages: PipelineStage[];
  clients: Client[];
}

export default function DealFormDialog({ open, onOpenChange, deal, presetStageId, stages, clients }: Props) {
  const { addDeal, updateDeal } = useDeals();
  const [form, setForm] = useState({
    title: "",
    client_id: "",
    stage_id: "",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    if (deal) {
      setForm({
        title: deal.title,
        client_id: deal.client_id || "",
        stage_id: deal.stage_id,
        amount: deal.amount ? String(deal.amount) : "",
        notes: deal.notes || "",
      });
    } else {
      setForm({
        title: "",
        client_id: "",
        stage_id: presetStageId || stages[0]?.id || "",
        amount: "",
        notes: "",
      });
    }
  }, [deal, open, presetStageId, stages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.stage_id) return;

    const payload = {
      title: form.title,
      client_id: form.client_id || null,
      stage_id: form.stage_id,
      amount: form.amount ? Number(form.amount) : 0,
      notes: form.notes || null,
    };

    if (deal) {
      updateDeal.mutate({ id: deal.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      addDeal.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{deal ? "Редактировать сделку" : "Новая сделка"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Название *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Этап</Label>
              <Select value={form.stage_id} onValueChange={(v) => setForm({ ...form, stage_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Сумма, ₽</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min={0} />
            </div>
          </div>
          <div>
            <Label>Клиент</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v === "__none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Не выбран" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Не выбран</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Заметки</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={addDeal.isPending || updateDeal.isPending || !form.title.trim()}>
              {deal ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
