import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LEAD_SOURCES = [
  { value: "website", label: "Сайт" },
  { value: "instagram", label: "Instagram" },
  { value: "recommendation", label: "Рекомендация" },
  { value: "exhibition", label: "Выставка" },
  { value: "cold_call", label: "Холодный звонок" },
  { value: "agent", label: "Агент" },
  { value: "calculator", label: "Калькулятор" },
  { value: "other", label: "Другое" },
];

const LEAD_STATUSES = [
  { value: "new", label: "Новый" },
  { value: "qualified", label: "Квалифицирован" },
  { value: "proposal_sent", label: "КП отправлено" },
  { value: "negotiation", label: "Переговоры" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: any | null;
  onSuccess?: () => void;
}

const emptyForm = {
  client_name: "",
  client_phone: "",
  client_email: "",
  status: "new",
  source: "website",
  amount: "",
  budget: "",
  region: "",
  product_interest: "",
  notes: "",
};

export default function LeadFormDialog({ open, onOpenChange, lead, onSuccess }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setForm({
        client_name: lead.client_name || "",
        client_phone: lead.client_phone || "",
        client_email: lead.client_email || "",
        status: lead.status || "new",
        source: lead.source || "website",
        amount: lead.amount?.toString() || "",
        budget: lead.budget?.toString() || "",
        region: lead.region || "",
        product_interest: lead.product_interest || "",
        notes: lead.notes || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [lead, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name.trim() || !form.client_phone.trim()) {
      toast.error("Заполните имя и телефон");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const payload = {
        client_name: form.client_name.trim(),
        client_phone: form.client_phone.trim() || null,
        client_email: form.client_email.trim() || null,
        status: form.status,
        source: form.source,
        amount: parseFloat(form.amount) || null,
        budget: parseFloat(form.budget) || null,
        region: form.region.trim() || null,
        product_interest: form.product_interest.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (lead) {
        const { error } = await supabase
          .from("leads")
          .update(payload as any)
          .eq("id", lead.id);
        if (error) throw error;
        toast.success("Лид обновлён");
      } else {
        const { error } = await supabase
          .from("leads")
          .insert({ ...payload, user_id: user.id } as any);
        if (error) throw error;
        toast.success("Лид создан");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead ? "Редактировать лид" : "Новый лид"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Имя клиента *</Label>
              <Input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} placeholder="Иванов Иван" required />
            </div>
            <div>
              <Label className="text-xs">Телефон *</Label>
              <Input value={form.client_phone} onChange={(e) => set("client_phone", e.target.value)} placeholder="+7 (___) ___-__-__" required />
            </div>
          </div>

          <div>
            <Label className="text-xs">Email</Label>
            <Input value={form.client_email} onChange={(e) => set("client_email", e.target.value)} placeholder="email@example.com" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Статус</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Источник</Label>
              <Select value={form.source} onValueChange={(v) => set("source", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Сумма (₽)</Label>
              <Input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="50000" />
            </div>
            <div>
              <Label className="text-xs">Бюджет (₽)</Label>
              <Input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="60000" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Регион</Label>
            <Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Новосибирская обл." />
          </div>

          <div>
            <Label className="text-xs">Интерес к продукту</Label>
            <Input value={form.product_interest} onChange={(e) => set("product_interest", e.target.value)} placeholder="Раковина, столешница..." />
          </div>

          <div>
            <Label className="text-xs">Заметки</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Комментарии..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Сохранение..." : lead ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
