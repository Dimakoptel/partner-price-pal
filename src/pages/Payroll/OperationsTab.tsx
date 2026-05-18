import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useOperations, type Operation } from "@/hooks/usePayroll";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const T = (n: string) => (supabase as any).from(n);

const UNIT_LABELS: Record<string, string> = {
  m2: "₽ за м²",
  hour: "₽ за час",
  piece: "₽ за шт",
};

interface OpForm {
  id?: string;
  name: string;
  category: string;
  unit: "m2" | "hour" | "piece";
  rate: string;
  norm_hours: string;
  description: string;
}

const empty: OpForm = { name: "", category: "", unit: "m2", rate: "", norm_hours: "", description: "" };

export default function OperationsTab() {
  const qc = useQueryClient();
  const { data: operations = [], isLoading } = useOperations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OpForm>(empty);

  const upsert = useMutation({
    mutationFn: async (f: OpForm) => {
      const rate = f.rate ? Number(f.rate) : 0;
      const payload: any = {
        name: f.name.trim(),
        category: f.category.trim() || null,
        unit: f.unit,
        rate,
        // зеркалим в legacy поле, чтобы старый код не сломался
        cost_per_hour: f.unit === "hour" ? rate : 0,
        norm_hours: f.norm_hours ? Number(f.norm_hours) : null,
        description: f.description.trim() || null,
      };
      if (f.id) {
        const { error } = await T("operations").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await T("operations").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operations"] });
      toast.success("Сохранено");
      setOpen(false);
      setForm(empty);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await T("operations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operations"] });
      toast.success("Удалено");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (o: any) => {
    setForm({
      id: o.id,
      name: o.name,
      category: o.category ?? "",
      unit: (o.unit as any) || "hour",
      rate: o.rate != null ? String(o.rate) : (o.cost_per_hour != null ? String(o.cost_per_hour) : ""),
      norm_hours: o.norm_hours != null ? String(o.norm_hours) : "",
      description: o.description ?? "",
    });
    setOpen(true);
  };

  const startAdd = () => {
    setForm(empty);
    setOpen(true);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Виды работ (операции)</h3>
          <p className="text-sm text-muted-foreground">
            Для каждой операции выбирается единица: м² (шлифовка, грунтование, лак),
            час (сборка форм, индивидуальные работы) или штука (фиксированная сдельная).
          </p>
        </div>
        <Button onClick={startAdd}><Plus className="mr-1 h-4 w-4" />Добавить</Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Единица</TableHead>
              <TableHead className="text-right">Ставка</TableHead>
              <TableHead className="text-right">Норма (ч)</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Загрузка…</TableCell></TableRow>
            ) : operations.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Операций нет</TableCell></TableRow>
            ) : operations.map((o: any) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.name}</TableCell>
                <TableCell>{o.category || "—"}</TableCell>
                <TableCell>{UNIT_LABELS[o.unit] || UNIT_LABELS.hour}</TableCell>
                <TableCell className="text-right">{Number(o.rate ?? o.cost_per_hour ?? 0).toLocaleString("ru-RU")}</TableCell>
                <TableCell className="text-right">{o.norm_hours ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(o)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Удалить операцию?")) del.mutate(o.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Редактировать операцию" : "Новая операция"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Название *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="напр. Шлифовка" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Категория</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="напр. Отделка" />
              </div>
              <div>
                <Label>Единица измерения *</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m2">м² (площадь поверхности)</SelectItem>
                    <SelectItem value="hour">час</SelectItem>
                    <SelectItem value="piece">штука</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ставка, ₽ за {form.unit === "m2" ? "м²" : form.unit === "hour" ? "час" : "шт"}</Label>
                <Input type="number" step="1" min="0" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
              </div>
              <div>
                <Label>Норма часов (справочно)</Label>
                <Input type="number" step="0.25" min="0" value={form.norm_hours} onChange={(e) => setForm({ ...form, norm_hours: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Описание</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={() => {
              if (!form.name.trim()) { toast.error("Укажите название"); return; }
              upsert.mutate(form);
            }} disabled={upsert.isPending}>
              {upsert.isPending ? "Сохранение…" : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
