import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
  typeId: string | null;
  onSuccess: () => void;
}

export default function DictionaryItemDialog({ open, onOpenChange, item, typeId, onSuccess }: Props) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    color: "",
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (item) {
      setForm({
        code: item.code,
        name: item.name,
        color: item.color || "",
        sort_order: item.sort_order,
        is_active: item.is_active,
      });
    } else {
      setForm({ code: "", name: "", color: "", sort_order: 0, is_active: true });
    }
  }, [item, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!typeId) throw new Error("Нет справочника");

      const payload = {
        type_id: typeId,
        code: form.code,
        name: form.name,
        color: form.color || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };

      if (item) {
        const { error } = await (supabase.from("dictionary_items" as any) as any)
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("dictionary_items" as any) as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(item ? "Изменения сохранены" : "Элемент добавлен");
      onSuccess();
    },
    onError: (e: any) => toast.error("Ошибка: " + e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Заполните код и название");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Редактировать" : "Добавить"} элемент справочника</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs">Код *</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="например: draft"
            />
          </div>
          <div>
            <Label className="text-xs">Название *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="например: Черновик"
            />
          </div>
          <div>
            <Label className="text-xs">Цвет</Label>
            <Input
              type="color"
              value={form.color || "#6366f1"}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-9 p-1 w-20"
            />
          </div>
          <div>
            <Label className="text-xs">Порядок отображения</Label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <Label className="text-sm">Активен</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
