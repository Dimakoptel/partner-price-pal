import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDictionaryItems } from "@/hooks/useDictionary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Package, Calculator, RotateCcw } from "lucide-react";

interface ProductForm {
  name: string;
  brand: string;
  model: string;
  type_item_id: string;
  concrete_grade_id: string;
  length_mm: number;
  width_mm: number;
  thickness_mm: number;
  volume_m3: number;
  weight_kg: number;
  weight_manual_override: boolean;
  surface_area_m2: number;
  is_active: boolean;
}

const EMPTY: ProductForm = {
  name: "",
  brand: "",
  model: "",
  type_item_id: "",
  concrete_grade_id: "",
  length_mm: 0,
  width_mm: 0,
  thickness_mm: 0,
  volume_m3: 0,
  weight_kg: 0,
  weight_manual_override: false,
  surface_area_m2: 0,
  is_active: true,
};

/** Геометрические расчёты */
function computeGeometry(L: number, W: number, T: number, density: number) {
  const volume = (L * W * T) / 1_000_000_000; // мм³ → м³
  const weight = volume * density;
  // Полная площадь поверхности обработки (все 6 граней) в м²
  const surface = (2 * (L * W + L * T + W * T)) / 1_000_000;
  return {
    volume: Number(volume.toFixed(4)),
    weight: Number(weight.toFixed(2)),
    surface: Number(surface.toFixed(3)),
  };
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const qc = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["products_page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nomenclature")
        .select("*, type_item:type_item_id(name), grade:concrete_grade_id(name)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("nomenclature")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Изделие архивировано");
      qc.invalidateQueries({ queryKey: ["products_page"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (productsQuery.data ?? []).filter((p: any) =>
      [p.name, p.brand, p.model, p.sku].some((f) => (f ?? "").toLowerCase().includes(q)),
    );
  }, [productsQuery.data, search]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-light tracking-tight flex items-center gap-2">
                <Package className="w-6 h-6 text-primary" /> Номенклатура изделий
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Каталог с авто-расчётом объёма, веса и площади
              </p>
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Новое изделие
            </Button>
          </div>
        </motion.div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию, бренду, модели..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Mobile-first card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {productsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground col-span-full text-center py-12">
              Загрузка...
            </p>
          ) : filtered.length === 0 ? (
            <div className="col-span-full border border-dashed border-border rounded-lg p-12 text-center">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? "Ничего не найдено" : "Нет изделий. Добавьте первое."}
              </p>
            </div>
          ) : (
            filtered.map((p: any) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-border bg-card p-4 hover:border-foreground/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {[p.brand, p.model].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  {p.type_item?.name && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {p.type_item.name}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Объём</div>
                    <div className="font-mono">{Number(p.volume_m3 ?? 0).toFixed(4)} м³</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Вес</div>
                    <div className="font-mono">
                      {Number(p.weight_kg ?? 0).toFixed(1)} кг
                      {p.weight_manual_override && (
                        <span className="text-amber-500 ml-1" title="Ручной ввод">
                          *
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Площадь</div>
                    <div className="font-mono">{Number(p.surface_area_m2 ?? 0).toFixed(2)} м²</div>
                  </div>
                </div>

                {(p.length_mm || p.width_mm || p.thickness_mm) > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-2 font-mono">
                    {p.length_mm}×{p.width_mm}×{p.thickness_mm} мм
                  </p>
                )}

                <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="w-3 h-3 mr-1" /> Изменить
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => {
                      if (confirm(`Архивировать «${p.name}»?`)) deleteMutation.mutate(p.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {open && (
          <ProductFormDialog
            initial={editing}
            onClose={() => setOpen(false)}
            onSaved={() => {
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["products_page"] });
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

function ProductFormDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data: types = [] } = useDictionaryItems("product_type");
  const { data: grades = [] } = useDictionaryItems("concrete_grade");

  const [form, setForm] = useState<ProductForm>(() =>
    initial
      ? {
          name: initial.name ?? "",
          brand: initial.brand ?? "",
          model: initial.model ?? "",
          type_item_id: initial.type_item_id ?? "",
          concrete_grade_id: initial.concrete_grade_id ?? "",
          length_mm: Number(initial.length_mm ?? 0),
          width_mm: Number(initial.width_mm ?? 0),
          thickness_mm: Number(initial.thickness_mm ?? 0),
          volume_m3: Number(initial.volume_m3 ?? 0),
          weight_kg: Number(initial.weight_kg ?? 0),
          weight_manual_override: Boolean(initial.weight_manual_override),
          surface_area_m2: Number(initial.surface_area_m2 ?? 0),
          is_active: initial.is_active ?? true,
        }
      : EMPTY,
  );

  // Плотность выбранной марки бетона (из metadata.density_kg_m3)
  const density = useMemo(() => {
    const g = grades.find((x) => x.id === form.concrete_grade_id);
    const md = (g?.metadata as any) ?? {};
    return Number(md.density_kg_m3) || 2400; // дефолт 2400 кг/м³
  }, [grades, form.concrete_grade_id]);

  // Авто-пересчёт при изменении габаритов или плотности
  useEffect(() => {
    const { volume, weight, surface } = computeGeometry(
      form.length_mm,
      form.width_mm,
      form.thickness_mm,
      density,
    );
    setForm((prev) => ({
      ...prev,
      volume_m3: volume,
      surface_area_m2: surface,
      // вес перетираем только если пользователь не зафиксировал ручной ввод
      weight_kg: prev.weight_manual_override ? prev.weight_kg : weight,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.length_mm, form.width_mm, form.thickness_mm, density]);

  const resetWeight = () => {
    const { weight } = computeGeometry(form.length_mm, form.width_mm, form.thickness_mm, density);
    setForm((p) => ({ ...p, weight_kg: weight, weight_manual_override: false }));
  };

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Strip leading zeros for number inputs (per project UI rule)
  const numHandler = (k: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/^0+(?=\d)/, "");
    set(k, (raw === "" ? 0 : Number(raw)) as any);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Укажите наименование");
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Не авторизован");

      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        type_item_id: form.type_item_id || null,
        concrete_grade_id: form.concrete_grade_id || null,
        length_mm: form.length_mm,
        width_mm: form.width_mm,
        thickness_mm: form.thickness_mm,
        volume_m3: form.volume_m3,
        weight_kg: form.weight_kg,
        weight_manual_override: form.weight_manual_override,
        surface_area_m2: form.surface_area_m2,
        is_active: form.is_active,
        size_mm:
          form.length_mm && form.width_mm
            ? `${form.length_mm}×${form.width_mm}×${form.thickness_mm}`
            : "",
      };

      if (initial?.id) {
        const { error } = await supabase
          .from("nomenclature")
          .update(payload)
          .eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("nomenclature")
          .insert({ ...payload, created_by: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(initial ? "Сохранено" : "Изделие создано");
      onSaved();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Редактировать изделие" : "Новое изделие"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Основное */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Основное</h3>
            <div>
              <Label className="text-xs">Наименование *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Тип</Label>
                <Select
                  value={form.type_item_id}
                  onValueChange={(v) => set("type_item_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.length === 0 ? (
                      <SelectItem value="__empty" disabled>
                        Нет типов (добавьте в справочниках)
                      </SelectItem>
                    ) : (
                      types.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Бренд</Label>
                <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Модель</Label>
                <Input value={form.model} onChange={(e) => set("model", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Габариты */}
          <section className="space-y-3 border-t border-border pt-4">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
              Габариты (мм)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Длина (L)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.length_mm}
                  onChange={numHandler("length_mm")}
                />
              </div>
              <div>
                <Label className="text-xs">Ширина (W)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.width_mm}
                  onChange={numHandler("width_mm")}
                />
              </div>
              <div>
                <Label className="text-xs">Толщина (T)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.thickness_mm}
                  onChange={numHandler("thickness_mm")}
                />
              </div>
            </div>
          </section>

          {/* Материал */}
          <section className="space-y-3 border-t border-border pt-4">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Материал</h3>
            <div>
              <Label className="text-xs">Марка бетона</Label>
              <Select
                value={form.concrete_grade_id}
                onValueChange={(v) => set("concrete_grade_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите марку" />
                </SelectTrigger>
                <SelectContent>
                  {grades.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      Нет марок (добавьте в справочниках)
                    </SelectItem>
                  ) : (
                    grades.map((g) => {
                      const md = (g.metadata as any) ?? {};
                      return (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                          {md.density_kg_m3 && (
                            <span className="text-muted-foreground ml-2 text-xs">
                              ({md.density_kg_m3} кг/м³)
                            </span>
                          )}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Плотность для расчёта: <span className="font-mono">{density} кг/м³</span>
              </p>
            </div>
          </section>

          {/* Авто-расчёт */}
          <section className="space-y-3 border-t border-border pt-4">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" /> Расчётные показатели
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border border-border bg-secondary/30 p-3 rounded-md">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Объём V
                </div>
                <div className="text-lg font-mono mt-1">{form.volume_m3.toFixed(4)}</div>
                <div className="text-[10px] text-muted-foreground">м³ = L×W×T / 10⁹</div>
              </div>

              <div className="border border-border bg-secondary/30 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Вес W
                  </div>
                  {form.weight_manual_override && (
                    <button
                      type="button"
                      onClick={resetWeight}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1"
                      title="Вернуть расчётный"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> сброс
                    </button>
                  )}
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={form.weight_kg}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/^0+(?=\d)/, "");
                    set("weight_kg", raw === "" ? 0 : Number(raw));
                    set("weight_manual_override", true);
                  }}
                  className="h-8 mt-1 font-mono text-base bg-background"
                />
                <div className="text-[10px] text-muted-foreground">
                  кг = V × {density}
                  {form.weight_manual_override && (
                    <span className="text-amber-500 ml-1">· ручной</span>
                  )}
                </div>
              </div>

              <div className="border border-border bg-secondary/30 p-3 rounded-md">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Площадь S
                </div>
                <div className="text-lg font-mono mt-1">{form.surface_area_m2.toFixed(3)}</div>
                <div className="text-[10px] text-muted-foreground">м² (все грани)</div>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-2 pt-2">
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => set("is_active", v)}
            />
            <Label className="text-sm">Активен</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
