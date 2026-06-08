import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Percent, Truck, Wrench, BarChart3 } from "lucide-react";

type Scenario = {
  id: string;
  code: string;
  name: string;
  color: string | null;
  metadata: Record<string, unknown> | null;
};

interface Props {
  /** Себестоимость из калькулятора (₽) */
  cost: number;
  /** Площадь, м² */
  surfaceM2: number;
  /** Вес, кг */
  weightKg: number;
  /** Начальная маржа (синхронизируется с калькулятором) */
  margin: number;
  onMarginChange: (m: number) => void;
}

const fmt = (n: number) =>
  Number.isFinite(n)
    ? n.toLocaleString("ru-RU", { maximumFractionDigits: 2 })
    : "—";

export default function PricingPanel({ cost, surfaceM2, weightKg, margin, onMarginChange }: Props) {
  const [scenarioCode, setScenarioCode] = useState<string>("standard");
  const [volumeDiscount, setVolumeDiscount] = useState(0); // %
  const [delivery, setDelivery] = useState(0);             // ₽
  const [installation, setInstallation] = useState(0);     // ₽
  const [vat, setVat] = useState(20);                      // %
  const [competitorPrice, setCompetitorPrice] = useState(0); // ₽ с НДС

  // --- сценарии из справочника
  const scenariosQ = useQuery({
    queryKey: ["pricing-scenarios"],
    queryFn: async () => {
      const { data: t } = await supabase
        .from("dictionary_types")
        .select("id")
        .eq("code", "pricing_scenario")
        .maybeSingle();
      if (!t) return [] as Scenario[];
      const { data } = await supabase
        .from("dictionary_items")
        .select("id, code, name, color, metadata")
        .eq("type_id", t.id)
        .eq("is_active", true)
        .order("sort_order");
      return (data ?? []) as unknown as Scenario[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // --- НДС по умолчанию из system_settings
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "default_vat_pct")
        .maybeSingle();
      const v = Number((data?.value as unknown) ?? 20);
      if (Number.isFinite(v)) setVat(v);
    })();
  }, []);

  // --- применение пресета сценария
  useEffect(() => {
    const sc = scenariosQ.data?.find((s) => s.code === scenarioCode);
    if (!sc?.metadata) return;
    const m = sc.metadata as Record<string, number>;
    if (typeof m.margin_pct === "number") onMarginChange(m.margin_pct);
    if (typeof m.volume_discount_pct === "number") setVolumeDiscount(m.volume_discount_pct);
    if (typeof m.vat_pct === "number") setVat(m.vat_pct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioCode, scenariosQ.data]);

  // --- расчёт
  const calc = useMemo(() => {
    const extras = delivery + installation;
    const base = (cost + extras) * (1 + margin / 100);
    const priceNoVat = base * (1 - volumeDiscount / 100);
    const priceWithVat = priceNoVat * (1 + vat / 100);
    const pricePerM2 = surfaceM2 > 0 ? priceWithVat / surfaceM2 : 0;
    const pricePerKg = weightKg > 0 ? priceWithVat / weightKg : 0;
    const diffAbs = competitorPrice > 0 ? priceWithVat - competitorPrice : 0;
    const diffPct = competitorPrice > 0 ? (diffAbs / competitorPrice) * 100 : 0;
    return { priceNoVat, priceWithVat, pricePerM2, pricePerKg, diffAbs, diffPct, extras };
  }, [cost, delivery, installation, margin, volumeDiscount, vat, surfaceM2, weightKg, competitorPrice]);

  const scenarios = scenariosQ.data ?? [];
  const currentScenario = scenarios.find((s) => s.code === scenarioCode);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Ценообразование</h3>
        {currentScenario && (
          <Badge
            variant="secondary"
            style={{ backgroundColor: `${currentScenario.color}20`, color: currentScenario.color ?? undefined }}
          >
            {currentScenario.name}
          </Badge>
        )}
      </div>

      {/* Сценарий */}
      <div className="space-y-2">
        <Label className="text-xs">Сценарий ценообразования</Label>
        <Select value={scenarioCode} onValueChange={setScenarioCode}>
          <SelectTrigger><SelectValue placeholder="Выберите сценарий" /></SelectTrigger>
          <SelectContent>
            {scenarios.map((s) => (
              <SelectItem key={s.id} value={s.code}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Параметры */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
            <Percent className="w-3 h-3" /> Маржа, %
          </Label>
          <Input type="number" inputMode="decimal" value={margin}
            onChange={(e) => onMarginChange(Number(e.target.value) || 0)}
            className="font-mono text-sm h-9" />
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
            <Percent className="w-3 h-3" /> Скидка на тираж, %
          </Label>
          <Input type="number" inputMode="decimal" value={volumeDiscount}
            onChange={(e) => setVolumeDiscount(Number(e.target.value) || 0)}
            className="font-mono text-sm h-9" />
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
            <Truck className="w-3 h-3" /> Доставка, ₽
          </Label>
          <Input type="number" inputMode="decimal" value={delivery}
            onChange={(e) => setDelivery(Number(e.target.value) || 0)}
            className="font-mono text-sm h-9" />
        </div>
        <div>
          <Label className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
            <Wrench className="w-3 h-3" /> Монтаж, ₽
          </Label>
          <Input type="number" inputMode="decimal" value={installation}
            onChange={(e) => setInstallation(Number(e.target.value) || 0)}
            className="font-mono text-sm h-9" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px] uppercase text-muted-foreground">НДС, %</Label>
          <Input type="number" inputMode="decimal" value={vat}
            onChange={(e) => setVat(Number(e.target.value) || 0)}
            className="font-mono text-sm h-9" />
        </div>
      </div>

      <Separator />

      {/* Результаты */}
      <div className="grid grid-cols-2 gap-2">
        <Kpi label="Цена без НДС" value={`${fmt(calc.priceNoVat)} ₽`} />
        <Kpi label="Цена с НДС" value={`${fmt(calc.priceWithVat)} ₽`} highlight />
        <Kpi label="Цена за м²" value={surfaceM2 > 0 ? `${fmt(calc.pricePerM2)} ₽` : "—"} />
        <Kpi label="Цена за кг" value={weightKg > 0 ? `${fmt(calc.pricePerKg)} ₽` : "—"} />
      </div>

      <Separator />

      {/* Конкуренты */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1">
          <BarChart3 className="w-3 h-3" /> Сравнение с конкурентом
        </Label>
        <Input type="number" inputMode="decimal" value={competitorPrice}
          onChange={(e) => setCompetitorPrice(Number(e.target.value) || 0)}
          placeholder="Цена конкурента, ₽ (с НДС)"
          className="font-mono text-sm" />
        {competitorPrice > 0 && (
          <div className={`rounded-md p-2 text-sm flex items-center justify-between ${
            calc.diffAbs <= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}>
            <span>
              {calc.diffAbs <= 0 ? "Дешевле конкурента" : "Дороже конкурента"} на
            </span>
            <span className="font-mono font-semibold">
              {fmt(Math.abs(calc.diffAbs))} ₽ ({fmt(Math.abs(calc.diffPct))} %)
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

function Kpi({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md p-2 text-center border ${
      highlight ? "bg-primary/10 border-primary/30" : "bg-secondary/30 border-border"
    }`}>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className={`font-mono font-semibold ${highlight ? "text-base" : "text-sm"}`}>{value}</div>
    </div>
  );
}
