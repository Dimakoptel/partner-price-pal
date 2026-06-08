import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Trash2, Plus, Save, Calculator, Package, Users, Wrench } from "lucide-react";

type Nom = {
  id: string; name: string; sku: string; category: string | null;
  surface_area_m2: number | null; weight_kg: number | null; size_mm: string | null;
  price_dealer: number | null;
};
type Op = {
  id: string; name: string; category: string | null; unit: string | null;
  norm_hours: number | null; rate: number | null; cost_per_hour: number | null;
};
type Emp = { id: string; name: string; position: string | null; hourly_rate: number | null; skill_level: string | null };

interface Row {
  key: string;
  operation_id: string | null;
  operation_name: string;
  unit: string;
  quantity: number;
  norm_hours: number;
  rate: number;
  hourly_rate: number;
  employee_id: string | null;
}

interface MatRow {
  key: string;
  nomenclature_id: string | null;
  name: string;
  quantity: number;
  price: number;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

function calcRowCost(r: Row): number {
  // Prefer fixed rate per unit when set; otherwise norm_hours * hourly_rate
  if (r.rate > 0) return r.rate * r.quantity;
  return r.norm_hours * r.quantity * r.hourly_rate;
}

export default function CostCalcTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [nomId, setNomId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [mats, setMats] = useState<MatRow[]>([]);
  const [margin, setMargin] = useState(30);
  const [saving, setSaving] = useState(false);

  const nomsQ = useQuery({
    queryKey: ["cost-noms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nomenclature")
        .select("id,name,sku,category,surface_area_m2,weight_kg,size_mm,price_dealer")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Nom[];
    },
  });

  const opsQ = useQuery({
    queryKey: ["cost-ops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operations")
        .select("id,name,category,unit,norm_hours,rate,cost_per_hour")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Op[];
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

  const noms = nomsQ.data ?? [];
  const ops = opsQ.data ?? [];
  const emps = empsQ.data ?? [];
  const selectedNom = noms.find((n) => n.id === nomId) || null;
  const surfaceM2 = selectedNom?.surface_area_m2 || 0;

  // When choosing a product, preload its operations from nomenclature_operations
  useEffect(() => {
    if (!nomId) return;
    (async () => {
      const { data } = await supabase
        .from("nomenclature_operations")
        .select("operation_id, quantity_override, fixed_cost, sort_order, operations(id,name,unit,norm_hours,rate,cost_per_hour)")
        .eq("nomenclature_id", nomId)
        .order("sort_order");
      const preset: Row[] = (data ?? []).map((r: any) => {
        const op = r.operations;
        const unit = (op?.unit ?? "m2") as string;
        const qty = r.quantity_override ?? (unit === "m2" ? surfaceM2 : 1);
        return {
          key: uid(),
          operation_id: op?.id ?? null,
          operation_name: op?.name ?? "Операция",
          unit,
          quantity: Number(qty || 0),
          norm_hours: Number(op?.norm_hours || 0),
          rate: r.fixed_cost != null ? Number(r.fixed_cost) : Number(op?.rate || 0),
          hourly_rate: Number(op?.cost_per_hour || 0),
          employee_id: null,
        };
      });
      setRows(preset);
      if (selectedNom && !name) setName(`Расчёт: ${selectedNom.name}`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomId]);

  const addOpRow = () => {
    setRows((r) => [...r, {
      key: uid(), operation_id: null, operation_name: "Новая операция",
      unit: "m2", quantity: surfaceM2 || 1, norm_hours: 0, rate: 0, hourly_rate: 0, employee_id: null,
    }]);
  };

  const pickOp = (key: string, opId: string) => {
    const op = ops.find((o) => o.id === opId);
    if (!op) return;
    setRows((rs) => rs.map((r) => r.key === key ? {
      ...r,
      operation_id: op.id,
      operation_name: op.name,
      unit: op.unit ?? "m2",
      norm_hours: Number(op.norm_hours || 0),
      rate: Number(op.rate || 0),
      hourly_rate: Number(op.cost_per_hour || r.hourly_rate || 0),
      quantity: (op.unit ?? "m2") === "m2" ? (surfaceM2 || r.quantity) : (r.quantity || 1),
    } : r));
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

  const addMat = () => setMats((m) => [...m, { key: uid(), nomenclature_id: null, name: "Материал", quantity: 1, price: 0 }]);
  const updMat = (key: string, patch: Partial<MatRow>) =>
    setMats((ms) => ms.map((m) => m.key === key ? { ...m, ...patch } : m));
  const pickMat = (key: string, nid: string) => {
    const n = noms.find((x) => x.id === nid);
    if (!n) return;
    updMat(key, { nomenclature_id: nid, name: n.name, price: Number(n.price_dealer || 0) });
  };
  const delMat = (key: string) => setMats((ms) => ms.filter((m) => m.key !== key));

  const totals = useMemo(() => {
    const labor = rows.reduce((s, r) => s + calcRowCost(r), 0);
    const materials = mats.reduce((s, m) => s + m.quantity * m.price, 0);
    const cost = labor + materials;
    const price = cost * (1 + margin / 100);
    return { labor, materials, cost, price, profit: price - cost };
  }, [rows, mats, margin]);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error("Укажите название расчёта"); return; }
    setSaving(true);
    try {
      const { data: calc, error } = await supabase
        .from("calculations")
        .insert({
          user_id: user.id,
          name: name.trim(),
          nomenclature_id: nomId,
          product_snapshot: selectedNom ? (selectedNom as unknown as Record<string, unknown>) : {},
          materials_snapshot: mats as unknown as Record<string, unknown>[],
          totals: { ...totals, margin_pct: margin },
        })
        .select("id")
        .single();
      if (error) throw error;

      if (rows.length > 0) {
        const payload = rows.map((r, i) => ({
          calculation_id: calc.id,
          operation_id: r.operation_id,
          employee_id: r.employee_id,
          operation_name: r.operation_name,
          unit: r.unit,
          quantity: r.quantity,
          norm_hours: r.norm_hours,
          rate: r.rate,
          hourly_rate: r.hourly_rate,
          total_cost: calcRowCost(r),
          sort_order: i,
        }));
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
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Калькулятор себестоимости и ЗП</h2>
        </div>
        <div className="space-y-2">
          <Label>Название расчёта</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Столешница Loft 2400" />
        </div>
        <div className="space-y-2">
          <Label>Изделие</Label>
          <Select value={nomId ?? ""} onValueChange={(v) => setNomId(v || null)}>
            <SelectTrigger><SelectValue placeholder="Выберите номенклатуру" /></SelectTrigger>
            <SelectContent>
              {noms.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.name} {n.sku ? `(${n.sku})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedNom && (
          <div className="flex flex-wrap gap-2 text-xs">
            {selectedNom.size_mm && <Badge variant="secondary">{selectedNom.size_mm}</Badge>}
            {selectedNom.weight_kg != null && <Badge variant="secondary">{selectedNom.weight_kg} кг</Badge>}
            {selectedNom.surface_area_m2 != null && <Badge>{selectedNom.surface_area_m2} м²</Badge>}
          </div>
        )}
      </Card>

      {/* Operations */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <h3 className="font-semibold">Операции и ЗП</h3>
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
          {rows.map((r) => (
            <div key={r.key} className="rounded-lg border p-3 space-y-2 bg-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <Select value={r.operation_id ?? ""} onValueChange={(v) => pickOp(r.key, v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={r.operation_name} />
                    </SelectTrigger>
                    <SelectContent>
                      {ops.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="icon" variant="ghost" onClick={() => delRow(r.key)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Кол-во ({r.unit})</Label>
                  <Input type="number" inputMode="decimal" value={r.quantity}
                    onChange={(e) => updRow(r.key, { quantity: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label className="text-xs">Ставка/ед</Label>
                  <Input type="number" inputMode="decimal" value={r.rate}
                    onChange={(e) => updRow(r.key, { rate: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label className="text-xs">Норма (ч)</Label>
                  <Input type="number" inputMode="decimal" value={r.norm_hours}
                    onChange={(e) => updRow(r.key, { norm_hours: Number(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Исполнитель</Label>
                  <Select value={r.employee_id ?? ""} onValueChange={(v) => pickEmp(r.key, v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {emps.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}{e.skill_level ? ` · ${e.skill_level}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Ставка ₽/ч</Label>
                  <Input type="number" inputMode="decimal" value={r.hourly_rate}
                    onChange={(e) => updRow(r.key, { hourly_rate: Number(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-sm">
                <span className="text-muted-foreground">
                  {r.rate > 0 ? "По ставке за единицу" : "Норма × ставка"}
                </span>
                <span className="font-semibold font-mono-industrial">
                  {calcRowCost(r).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Materials */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <h3 className="font-semibold">Материалы</h3>
          </div>
          <Button size="sm" variant="outline" onClick={addMat}>
            <Plus className="h-4 w-4 mr-1" />Материал
          </Button>
        </div>

        {mats.length === 0 && (
          <p className="text-sm text-muted-foreground">Добавьте материалы из номенклатуры.</p>
        )}

        <div className="space-y-3">
          {mats.map((m) => (
            <div key={m.key} className="rounded-lg border p-3 space-y-2 bg-card">
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
                  <Label className="text-xs">Кол-во</Label>
                  <Input type="number" inputMode="decimal" value={m.quantity}
                    onChange={(e) => updMat(m.key, { quantity: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label className="text-xs">Цена ₽</Label>
                  <Input type="number" inputMode="decimal" value={m.price}
                    onChange={(e) => updMat(m.key, { price: Number(e.target.value) || 0 })} />
                </div>
                <div className="text-right text-sm font-semibold font-mono-industrial">
                  {(m.quantity * m.price).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Totals */}
      <Card className="p-4 space-y-3 sticky bottom-0 shadow-industrial-lg">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <h3 className="font-semibold">Итоги</h3>
        </div>
        <div className="space-y-1 text-sm font-mono-industrial">
          <Row label="ЗП (операции)" value={totals.labor} />
          <Row label="Материалы" value={totals.materials} />
          <Separator />
          <Row label="Себестоимость" value={totals.cost} bold />
        </div>
        <div className="grid grid-cols-2 gap-2 items-end">
          <div>
            <Label className="text-xs">Маржа, %</Label>
            <Input type="number" inputMode="decimal" value={margin}
              onChange={(e) => setMargin(Number(e.target.value) || 0)} />
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Цена продажи</div>
            <div className="text-xl font-bold font-mono-industrial">
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

      {/* History */}
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
              <div className="font-mono-industrial">
                {Number(h.totals?.price || 0).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : ""}`}>
      <span>{label}</span>
      <span>{value.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽</span>
    </div>
  );
}
