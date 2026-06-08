import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
  typeId: string | null;
  onSuccess: () => void;
}

// Suggested metadata presets per dictionary type code
const METADATA_HINTS: Record<string, { keys: { key: string; label: string; type: "number" | "text" }[]; description: string }> = {
  employee_level: {
    description: "Атрибуты уровня сотрудника",
    keys: [
      { key: "base_hourly_rate", label: "Базовая ставка ₽/час", type: "number" },
      { key: "multiplier", label: "Коэффициент", type: "number" },
    ],
  },
  concrete_grade: {
    description: "Характеристики марки бетона",
    keys: [
      { key: "density_kg_m3", label: "Плотность, кг/м³", type: "number" },
      { key: "price_per_kg", label: "Цена ₽/кг", type: "number" },
      { key: "strength_mpa", label: "Прочность, МПа", type: "number" },
    ],
  },
  unit: {
    description: "Единица измерения",
    keys: [
      { key: "short", label: "Сокращение", type: "text" },
      { key: "to_base", label: "Коэффициент к базовой", type: "number" },
    ],
  },
  production_stage: {
    description: "Стадия производства",
    keys: [
      { key: "duration_days", label: "Длительность (дни)", type: "number" },
      { key: "complexity", label: "Сложность (1-5)", type: "number" },
    ],
  },
};

export default function DictionaryItemDialog({ open, onOpenChange, item, typeId, onSuccess }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    code: "",
    name: "",
    color: "",
    sort_order: 0,
    is_active: true,
    semantic_tags: "" as string, // comma-separated, edited as text
  });
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [metadataJson, setMetadataJson] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [typeCode, setTypeCode] = useState<string>("");

  useEffect(() => {
    if (!typeId) return;
    supabase
      .from("dictionary_types")
      .select("code")
      .eq("id", typeId)
      .single()
      .then(({ data }) => setTypeCode(data?.code ?? ""));
  }, [typeId]);

  useEffect(() => {
    if (item) {
      setForm({
        code: item.code,
        name: item.name,
        color: item.color || "",
        sort_order: item.sort_order,
        is_active: item.is_active,
        semantic_tags: Array.isArray(item.semantic_tags) ? item.semantic_tags.join(", ") : "",
      });
      const md = item.metadata || {};
      setMetadata(md);
      setMetadataJson(JSON.stringify(md, null, 2));
    } else {
      setForm({ code: "", name: "", color: "", sort_order: 0, is_active: true, semantic_tags: "" });
      setMetadata({});
      setMetadataJson("{}");
    }
    setJsonError(null);
  }, [item, open]);

  const hint = METADATA_HINTS[typeCode];

  const updatePresetField = (key: string, value: string, type: "number" | "text") => {
    const next = { ...metadata };
    if (value === "") {
      delete next[key];
    } else {
      next[key] = type === "number" ? Number(value) : value;
    }
    setMetadata(next);
    setMetadataJson(JSON.stringify(next, null, 2));
    setJsonError(null);
  };

  const handleJsonChange = (val: string) => {
    setMetadataJson(val);
    try {
      const parsed = JSON.parse(val || "{}");
      if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
        setJsonError("JSON должен быть объектом");
        return;
      }
      setMetadata(parsed);
      setJsonError(null);
    } catch (e: any) {
      setJsonError("Невалидный JSON");
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!typeId) throw new Error("Нет справочника");
      if (jsonError) throw new Error(jsonError);

      const tagsArr = form.semantic_tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        type_id: typeId,
        code: form.code,
        name: form.name,
        color: form.color || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
        metadata,
        semantic_tags: tagsArr,
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
      qc.invalidateQueries({ queryKey: ["dictionary_items"] });
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Редактировать" : "Добавить"} элемент справочника</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Код *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="draft"
              />
            </div>
            <div>
              <Label className="text-xs">Название *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Черновик"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Цвет</Label>
              <Input
                type="color"
                value={form.color || "#6366f1"}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-9 p-1 w-full"
              />
            </div>
            <div>
              <Label className="text-xs">Порядок</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <Label className="text-sm">Активен</Label>
          </div>

          <div>
            <Label className="text-xs">Семантические метки</Label>
            <Input
              value={form.semantic_tags}
              onChange={(e) => setForm({ ...form, semantic_tags: e.target.value })}
              placeholder="initial, active, final"
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Через запятую. По меткам система определяет роль элемента (например{" "}
              <code>initial</code>, <code>active</code>, <code>final</code>, <code>skipped</code>,{" "}
              <code>paused</code>, <code>cancelled</code>). Можно свободно менять код и название —
              кнопки и переходы будут продолжать работать, пока метки на месте.
            </p>
          </div>

          {/* Preset metadata fields */}
          {hint && (
            <div className="space-y-3 border border-border rounded-md p-3 bg-secondary/30">
              <div>
                <Label className="text-xs font-medium">{hint.description}</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Заполните либо поля ниже, либо JSON напрямую
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {hint.keys.map((k) => (
                  <div key={k.key}>
                    <Label className="text-[11px] text-muted-foreground">{k.label}</Label>
                    <Input
                      type={k.type}
                      value={metadata[k.key] ?? ""}
                      onChange={(e) => updatePresetField(k.key, e.target.value, k.type)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON editor */}
          <div>
            <Label className="text-xs">
              Атрибуты (JSON) {jsonError && <span className="text-destructive ml-2">{jsonError}</span>}
            </Label>
            <Textarea
              value={metadataJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={6}
              className="font-mono text-xs"
              placeholder='{"key": "value"}'
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Произвольные атрибуты элемента (например: базовая ставка, плотность, коэффициенты)
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={saveMutation.isPending || !!jsonError}>
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
