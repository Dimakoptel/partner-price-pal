import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Trash2, Plus, Save, Calculator, Package, Wrench, Clock, Wallet, AlertCircle, Download, Printer, Radio } from "lucide-react";
import PricingPanel from "./PricingPanel";

type Nom = {
  id: string; name: string; sku: string; category: string | null;
  surface_area_m2: number | null; weight_kg: number | null; size_mm: string | null;
  price_dealer: number | null; complexity_coef: number | null; volume_m3: number | null;
};
type Op = {
  id: string; name: string; category: string | null; unit: string | null;
  norm_hours: number | null; norm_minutes: number | null;
  rate: number | null; cost_per_hour: number | null;
  complexity_coef: number | null; min_skill_level: string | null;
};
type Emp = {
  id: string; name: string; position: string | null;
  hourly_rate: number | null; skill_level: string | null;
};

const SKILL_RANK: Record<string, number> = { junior: 1, middle: 2, senior: 3, master: 4 };
const SKILL_LABEL: Record<string, string> = {
  junior: "Junior", middle: "Middle", senior: "Senior", master: "Master",
};

interface Row {
  key: string;
  operation_id: string | null;
  operation_name: string;
  unit: string;
  quantity: number;          // объём работ (м², шт)
  norm_minutes: number;      // норма времени в мин/ед
  op_complexity: number;     // коэф. операции
  hourly_rate: number;       // ставка ₽/час
  employee_id: string | null;
  min_skill_level: string | null;
}

interface MatRow {
  key: string;
  nomenclature_id: string | null;
  name: string;
  quantity: number;
  price: number;
  auto?: boolean; // подобран автоматически
}

function uid() { return Math.random().toString(36).slice(2, 10); }

/**
 * Формула ЗП:
 *   часы = (норма_мин × объём × коэф_оп × коэф_изделия) / 60
 *   ЗП   = часы × ставка
 */
function calcRow(r: Row, productCoef: number): { hours: number; cost: number } {
  const hours = (r.norm_minutes * r.quantity * r.op_complexity * productCoef) / 60;
  return { hours, cost: hours * r.hourly_rate };
}

export default function CostCalcTab() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ---------- Параметры изделия ----------
  const [name, setName] = useState("");
  const [nomId, setNomId] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  // ручные значения (используются если manualMode или нет nomId)
  const [manualArea, setManualArea] = useState(0);
  const [manualWeight, setManualWeight] = useState(0);
  const [manualComplexity, setManualComplexity] = useState(1);

  const [rows, setRows] = useState<Row[]>([]);
  const [mats, setMats] = useState<MatRow[]>([]);
  const [margin, setMargin] = useState(30);
  const [saving, setSaving] = useState(false);

  // ---------- Загрузка справочников ----------
  const nomsQ = useQuery({
    queryKey: ["cost-noms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nomenclature")
        .select("id,name,sku,category,surface_area_m2,weight_kg,size_mm,price_dealer,complexity_coef,volume_m3")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Nom[];
    },
  });

  const opsQ = useQuery({
    queryKey: ["cost-ops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operations")
        .select("id,name,category,unit,norm_hours,norm_minutes,rate,cost_per_hour,complexity_coef,min_skill_level")
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Op[];
    },
  });

  const empsQ = useQuery({
    queryKey: ["cost-emps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id,name,position,hourly_rate,skill_level")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Emp[];
    },
  });

  const historyQ = useQuery({
    queryKey: ["cost-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculations")
        .select("id,name,totals,created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // ---------- Realtime: при изменении ставок/операций/номенклатуры — обновлять кэш ----------
  const [rtConnected, setRtConnected] = useState(false);
  useEffect(() => {
    const channel = supabase
      .channel("cost-calc-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["cost-emps"] });
          // Обновить ставку в активных строках, если эту запись редактировали
          const row = (payload.new ?? payload.old) as { id?: string; hourly_rate?: number } | null;
          if (row?.id && payload.new) {
            setRows((rs) => rs.map((r) =>
              r.employee_id === row.id && typeof row.hourly_rate === "number"
                ? { ...r, hourly_rate: Number(row.hourly_rate) }
                : r
            ));
            toast.info("Ставка сотрудника обновлена — пересчёт выполнен");
          }
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "operations" },
        () => qc.invalidateQueries({ queryKey: ["cost-ops"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "nomenclature" },
        () => qc.invalidateQueries({ queryKey: ["cost-noms"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "dictionary_items" },
        () => qc.invalidateQueries({ queryKey: ["dict_options"] }))
      .subscribe((status) => setRtConnected(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noms = nomsQ.data ?? [];
  const ops = opsQ.data ?? [];
  const emps = empsQ.data ?? [];
  const selectedNom = noms.find((n) => n.id === nomId) || null;

  // Эффективные параметры изделия (из выбранного или ручные)
  const useManual = manualMode || !selectedNom;
  const surfaceM2 = useManual ? manualArea : Number(selectedNom?.surface_area_m2 || 0);
  const weightKg = useManual ? manualWeight : Number(selectedNom?.weight_kg || 0);
  const productCoef = useManual ? manualComplexity : Number(selectedNom?.complexity_coef || 1);

  // При выборе изделия — подгрузить связанные операции и подставить параметры
  useEffect(() => {
    if (!nomId || manualMode) return;
    (async () => {
      const { data } = await supabase
        .from("nomenclature_operations")
        .select("operation_id, quantity_override, sort_order, operations(id,name,unit,norm_hours,norm_minutes,rate,cost_per_hour,complexity_coef,min_skill_level)")
        .eq("nomenclature_id", nomId)
        .order("sort_order");

      const surface = Number(selectedNom?.surface_area_m2 || 0);
      const preset: Row[] = (data ?? []).map((r: any) => {
        const op = r.operations;
        const unit = (op?.unit ?? "m2") as string;
        const qty = r.quantity_override ?? (unit === "m2" ? surface : 1);
        const normMin = Number(op?.norm_minutes || (op?.norm_hours ? op.norm_hours * 60 : 0));
        return {
          key: uid(),
          operation_id: op?.id ?? null,
          operation_name: op?.name ?? "Операция",
          unit,
          quantity: Number(qty || 0),
          norm_minutes: normMin,
          op_complexity: Number(op?.complexity_coef ?? 1),
          hourly_rate: Number(op?.cost_per_hour || 0),
          employee_id: null,
          min_skill_level: op?.min_skill_level ?? null,
        };
      });
      setRows(preset);
      if (selectedNom && !name) setName(`Расчёт: ${selectedNom.name}`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomId, manualMode]);

  // ---------- Операции ----------
  const addOpRow = () => {
    setRows((r) => [...r, {
      key: uid(), operation_id: null, operation_name: "Новая операция",
      unit: "m2", quantity: surfaceM2 || 1, norm_minutes: 0, op_complexity: 1,
      hourly_rate: 0, employee_id: null, min_skill_level: null,
    }]);
  };

  const pickOp = (key: string, opId: string) => {
    const op = ops.find((o) => o.id === opId);
    if (!op) return;
    const normMin = Number(op.norm_minutes || (op.norm_hours ? op.norm_hours * 60 : 0));
    setRows((rs) => rs.map((r) => r.key === key ? {
      ...r,
      operation_id: op.id,
      operation_name: op.name,
      unit: op.unit ?? "m2",
      norm_minutes: normMin,
      op_complexity: Number(op.complexity_coef ?? 1),
      hourly_rate: Number(op.cost_per_hour || r.hourly_rate || 0),
      quantity: (op.unit ?? "m2") === "m2" ? (surfaceM2 || r.quantity) : (r.quantity || 1),
      min_skill_level: op.min_skill_level ?? null,
      // если выбранный исполнитель не дотягивает — сбросить
      employee_id: (() => {
        if (!r.employee_id || !op.min_skill_level) return r.employee_id;
        const e = emps.find((x) => x.id === r.employee_id);
        const need = SKILL_RANK[op.min_skill_level] ?? 0;
        const have = SKILL_RANK[e?.skill_level || ""] ?? 0;
        return have >= need ? r.employee_id : null;
      })(),
    } : r));
  };

  const eligibleEmps = (minLevel: string | null) => {
    if (!minLevel) return emps;
    const need = SKILL_RANK[minLevel] ?? 0;
    return emps.filter((e) => (SKILL_RANK[e.skill_level || ""] ?? 0) >= need);
  };

  const pickEmp = (key: string, empId: string) => {
    const e = emps.find((x) => x.id === empId);
    setRows((rs) => rs.map((r) => r.key === key ? {
      ...r,
      employee_id: empId,
      hourly_rate: e?.hourly_rate ? Number(e.hourly_rate) : r.hourly_rate,
    } : r));
  };

  const updRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => r.key === key ? { ...r, ...patch } : r));
  const delRow = (key: string) => setRows((rs) => rs.filter((r) => r.key !== key));

  // ---------- Материалы ----------
  const addMat = () => setMats((m) => [...m, {
    key: uid(), nomenclature_id: null, name: "Материал", quantity: 1, price: 0,
  }]);
  const updMat = (key: string, patch: Partial<MatRow>) =>
    setMats((ms) => ms.map((m) => m.key === key ? { ...m, ...patch } : m));
  const pickMat = (key: string, nid: string) => {
    const n = noms.find((x) => x.id === nid);
    if (!n) return;
    updMat(key, { nomenclature_id: nid, name: n.name, price: Number(n.price_dealer || 0) });
  };
  const delMat = (key: string) => setMats((ms) => ms.filter((m) => m.key !== key));

  /**
   * Автоподбор материалов на основе выбранных операций и параметров изделия.
   * Простая эвристика: для категорий операций предлагаем материалы из номенклатуры
   * с категорией "material" + расход пропорционален площади или весу.
   */
  const autoSuggestMaterials = () => {
    if (rows.length === 0) {
      toast.error("Сначала добавьте операции");
      return;
    }
    // Группируем по категории операции, берём материалы из nomenclature с category='material'
    const materialNoms = noms.filter((n) =>
      (n.category || "").toLowerCase().includes("материал") ||
      (n.category || "").toLowerCase() === "material",
    );

    if (materialNoms.length === 0) {
      toast.info("В номенклатуре нет товаров категории «Материал». Добавьте вручную.");
      return;
    }

    const auto: MatRow[] = [];
    rows.forEach((r) => {
      // Простое правило: на каждую операцию по площади/шт — 1 ед. первого материала из категории
      const candidate = materialNoms[0];
      if (!candidate) return;
      const qty = Number((r.quantity || 0).toFixed(2));
      if (qty > 0) {
        auto.push({
          key: uid(),
          nomenclature_id: candidate.id,
          name: `${candidate.name} (для «${r.operation_name}»)`,
          quantity: qty,
          price: Number(candidate.price_dealer || 0),
          auto: true,
        });
      }
    });
    setMats((m) => [...m.filter((x) => !x.auto), ...auto]);
    toast.success(`Подобрано ${auto.length} материалов`);
  };

  // ---------- Итоги ----------
  const totals = useMemo(() => {
    let labor = 0;
    let totalHours = 0;
    rows.forEach((r) => {
      const { hours, cost } = calcRow(r, productCoef);
      labor += cost;
      totalHours += hours;
    });
    const materials = mats.reduce((s, m) => s + m.quantity * m.price, 0);
    const cost = labor + materials;
    const price = cost * (1 + margin / 100);
    return { labor, materials, cost, price, profit: price - cost, totalHours };
  }, [rows, mats, margin, productCoef]);

  // ---------- Сохранение ----------
  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error("Укажите название расчёта"); return; }
    setSaving(true);
    try {
      const snapshot = useManual
        ? { manual: true, surface_area_m2: surfaceM2, weight_kg: weightKg, complexity_coef: productCoef }
        : { ...(selectedNom ?? {}), complexity_coef: productCoef };

      const { data: calc, error } = await supabase
        .from("calculations")
        .insert([{
          user_id: user.id,
          name: name.trim(),
          nomenclature_id: nomId,
          product_snapshot: snapshot as any,
          materials_snapshot: mats as any,
          totals: { ...totals, margin_pct: margin, product_coef: productCoef } as any,
        }])
        .select("id")
        .single();
      if (error) throw error;

      if (rows.length > 0) {
        const payload = rows.map((r, i) => {
          const { hours, cost } = calcRow(r, productCoef);
          return {
            calculation_id: calc.id,
            operation_id: r.operation_id,
            employee_id: r.employee_id,
            operation_name: r.operation_name,
            unit: r.unit,
            quantity: r.quantity,
            norm_hours: hours,
            rate: 0,
            hourly_rate: r.hourly_rate,
            total_cost: cost,
            sort_order: i,
          };
        });
        const { error: e2 } = await supabase.from("calc_operations").insert(payload);
        if (e2) throw e2;
      }
      toast.success("Расчёт сохранён");
      qc.invalidateQueries({ queryKey: ["cost-history"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка сохранения";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setName(""); setNomId(null); setRows([]); setMats([]); setMargin(30);
    setManualMode(false); setManualArea(0); setManualWeight(0); setManualComplexity(1);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-32">
      {/* ============== Параметры изделия ============== */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Калькулятор ЗП и себестоимости</h2>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Название расчёта</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Например: Столешница Loft 2400" />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Label className="text-xs">Ручной ввод параметров</Label>
          <Switch checked={manualMode} onCheckedChange={setManualMode} />
        </div>

        {!manualMode && (
          <div className="space-y-2">
            <Label className="text-xs">Изделие (из номенклатуры)</Label>
            <Select value={nomId ?? ""} onValueChange={(v) => setNomId(v || null)}>
              <SelectTrigger><SelectValue placeholder="Выберите изделие" /></SelectTrigger>
              <SelectContent>
                {noms.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.name}{n.sku ? ` (${n.sku})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Параметры — авто или ручные */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Площадь, м²</Label>
            <Input type="number" inputMode="decimal" disabled={!useManual}
              value={surfaceM2}
              onChange={(e) => setManualArea(Number(e.target.value.replace(/^0+(?=\d)/, "")) || 0)}
              className="font-mono text-sm" />
          </div>
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Вес, кг</Label>
            <Input type="number" inputMode="decimal" disabled={!useManual}
              value={weightKg}
              onChange={(e) => setManualWeight(Number(e.target.value.replace(/^0+(?=\d)/, "")) || 0)}
              className="font-mono text-sm" />
          </div>
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Коэф. сложности</Label>
            <Input type="number" inputMode="decimal" step="0.1" disabled={!useManual}
              value={productCoef}
              onChange={(e) => setManualComplexity(Number(e.target.value) || 1)}
              className="font-mono text-sm" />
          </div>
        </div>

        {selectedNom && !manualMode && (
          <div className="flex flex-wrap gap-1.5 text-xs pt-1">
            {selectedNom.size_mm && <Badge variant="secondary">{selectedNom.size_mm}</Badge>}
            {selectedNom.volume_m3 != null && (
              <Badge variant="secondary">{Number(selectedNom.volume_m3).toFixed(4)} м³</Badge>
            )}
          </div>
        )}
      </Card>

      {/* ============== Конструктор операций ============== */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <h3 className="font-semibold">Операции (ЗП)</h3>
          </div>
          <Button size="sm" variant="outline" onClick={addOpRow}>
            <Plus className="h-4 w-4 mr-1" />Операция
          </Button>
        </div>

        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Выберите изделие — операции подгрузятся автоматически, либо добавьте вручную.
          </p>
        )}

        <div className="space-y-3">
          {rows.map((r) => {
            const { hours, cost } = calcRow(r, productCoef);
            const eligible = eligibleEmps(r.min_skill_level);
            return (
              <div key={r.key} className="rounded-lg border p-3 space-y-2 bg-card">
                <div className="flex items-start justify-between gap-2">
                  <Select value={r.operation_id ?? ""} onValueChange={(v) => pickOp(r.key, v)}>
                    <SelectTrigger className="h-9 flex-1">
                      <SelectValue placeholder={r.operation_name} />
                    </SelectTrigger>
                    <SelectContent>
                      {ops.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                          {o.min_skill_level && (
                            <span className="text-muted-foreground ml-2 text-xs">
                              · {SKILL_LABEL[o.min_skill_level]}+
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={() => delRow(r.key)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Объём ({r.unit})</Label>
                    <Input type="number" inputMode="decimal" value={r.quantity}
                      onChange={(e) => updRow(r.key, { quantity: Number(e.target.value) || 0 })}
                      className="font-mono text-sm h-9" />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Норма, мин/ед</Label>
                    <Input type="number" inputMode="decimal" value={r.norm_minutes}
                      onChange={(e) => updRow(r.key, { norm_minutes: Number(e.target.value) || 0 })}
                      className="font-mono text-sm h-9" />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Коэф. оп.</Label>
                    <Input type="number" inputMode="decimal" step="0.1" value={r.op_complexity}
                      onChange={(e) => updRow(r.key, { op_complexity: Number(e.target.value) || 1 })}
                      className="font-mono text-sm h-9" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">
                      Исполнитель
                      {r.min_skill_level && (
                        <span className="ml-1 text-amber-500">
                          (от {SKILL_LABEL[r.min_skill_level]})
                        </span>
                      )}
                    </Label>
                    <Select value={r.employee_id ?? ""} onValueChange={(v) => pickEmp(r.key, v)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={eligible.length === 0 ? "Нет подходящих" : "—"} />
                      </SelectTrigger>
                      <SelectContent>
                        {eligible.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                            {e.skill_level && (
                              <span className="text-muted-foreground ml-2 text-xs">
                                · {SKILL_LABEL[e.skill_level]}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Ставка ₽/ч</Label>
                    <Input type="number" inputMode="decimal" value={r.hourly_rate}
                      onChange={(e) => updRow(r.key, { hourly_rate: Number(e.target.value) || 0 })}
                      className="font-mono text-sm h-9" />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-sm border-t border-border">
                  <span className="text-xs text-muted-foreground font-mono">
                    {hours.toFixed(2)} ч × {r.hourly_rate} ₽
                  </span>
                  <span className="font-semibold font-mono">
                    {cost.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {rows.length > 0 && (
          <p className="text-[10px] text-muted-foreground font-mono pt-2 border-t border-border">
            ЗП = (норма_мин × объём × коэф_оп × коэф_изд / 60) × ставка ₽/ч
          </p>
        )}
      </Card>

      {/* ============== Материалы ============== */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <h3 className="font-semibold">Материалы</h3>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={autoSuggestMaterials}
              title="Подобрать материалы из номенклатуры по операциям">
              <AlertCircle className="h-3.5 w-3.5 mr-1" />Авто-подбор
            </Button>
            <Button size="sm" variant="outline" onClick={addMat}>
              <Plus className="h-4 w-4 mr-1" />Материал
            </Button>
          </div>
        </div>

        {mats.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Добавьте материалы из номенклатуры или нажмите «Авто-подбор».
          </p>
        )}

        <div className="space-y-3">
          {mats.map((m) => (
            <div key={m.key} className={`rounded-lg border p-3 space-y-2 ${m.auto ? "bg-primary/5 border-primary/30" : "bg-card"}`}>
              <div className="flex items-start justify-between gap-2">
                <Select value={m.nomenclature_id ?? ""} onValueChange={(v) => pickMat(m.key, v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder={m.name} /></SelectTrigger>
                  <SelectContent>
                    {noms.map((n) => (
                      <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" onClick={() => delMat(m.key)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 items-end">
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Кол-во</Label>
                  <Input type="number" inputMode="decimal" value={m.quantity}
                    onChange={(e) => updMat(m.key, { quantity: Number(e.target.value) || 0 })}
                    className="font-mono text-sm h-9" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Цена ₽</Label>
                  <Input type="number" inputMode="decimal" value={m.price}
                    onChange={(e) => updMat(m.key, { price: Number(e.target.value) || 0 })}
                    className="font-mono text-sm h-9" />
                </div>
                <div className="text-right text-sm font-semibold font-mono pb-1">
                  {(m.quantity * m.price).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ============== Итоговые показатели ============== */}
      <Card className="p-4 space-y-3 sticky bottom-0 shadow-lg">
        <h3 className="font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4" /> Итоги
        </h3>

        {/* Ключевые метрики — KPI карточки */}
        <div className="grid grid-cols-3 gap-2">
          <div className="border border-border rounded-md p-2 bg-secondary/30 text-center">
            <Clock className="w-3 h-3 mx-auto text-muted-foreground mb-1" />
            <div className="text-[10px] uppercase text-muted-foreground">Время</div>
            <div className="text-sm font-mono font-semibold">
              {totals.totalHours.toFixed(2)} ч
            </div>
          </div>
          <div className="border border-border rounded-md p-2 bg-secondary/30 text-center">
            <Wallet className="w-3 h-3 mx-auto text-muted-foreground mb-1" />
            <div className="text-[10px] uppercase text-muted-foreground">ФОТ</div>
            <div className="text-sm font-mono font-semibold">
              {totals.labor.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
            </div>
          </div>
          <div className="border border-border rounded-md p-2 bg-secondary/30 text-center">
            <Package className="w-3 h-3 mx-auto text-muted-foreground mb-1" />
            <div className="text-[10px] uppercase text-muted-foreground">Материалы</div>
            <div className="text-sm font-mono font-semibold">
              {totals.materials.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-1 text-sm font-mono">
          <SumRow label="Себестоимость" value={totals.cost} bold />
        </div>

        <div className="grid grid-cols-2 gap-2 items-end">
          <div>
            <Label className="text-xs">Маржа, %</Label>
            <Input type="number" inputMode="decimal" value={margin}
              onChange={(e) => setMargin(Number(e.target.value) || 0)} />
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Цена продажи</div>
            <div className="text-xl font-bold font-mono">
              {totals.price.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleSave} disabled={saving || !user}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
          <Button variant="outline" onClick={reset}>Сброс</Button>
        </div>
      </Card>

      {/* ============== Ценообразование ============== */}
      <PricingPanel
        cost={totals.cost}
        surfaceM2={surfaceM2}
        weightKg={weightKg}
        margin={margin}
        onMarginChange={setMargin}
      />


      {/* ============== История ============== */}
      <Card className="p-4 space-y-2">
        <h3 className="font-semibold">Последние расчёты</h3>
        {historyQ.isLoading && <p className="text-sm text-muted-foreground">Загрузка...</p>}
        {(historyQ.data ?? []).length === 0 && !historyQ.isLoading && (
          <p className="text-sm text-muted-foreground">Пока нет сохранённых расчётов.</p>
        )}
        <div className="space-y-2">
          {(historyQ.data ?? []).map((h: any) => (
            <div key={h.id} className="flex items-center justify-between border rounded-lg p-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{h.name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(h.created_at).toLocaleString("ru-RU")}
                </div>
              </div>
              <div className="font-mono">
                {Number(h.totals?.price || 0).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SumRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : ""}`}>
      <span>{label}</span>
      <span>{value.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽</span>
    </div>
  );
}
