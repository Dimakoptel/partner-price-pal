import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { usePricing } from "@/hooks/usePricing";
import { useColors, StandardColor } from "@/hooks/useColors";
import { useCalculations, SavedCalculation } from "@/hooks/useCalculations";
import { useCompanySettings, CompanySetting } from "@/hooks/useCompanySettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const CATEGORY_LABELS: Record<string, string> = {
  general: "Общие параметры",
  countertop: "Столешница",
  sink: "Раковина",
  windowsill: "Подоконник",
  backsplash: "Фартук",
  stair: "Ступени",
  stepslab: "Пошаговая плита",
};

function formatPrice(num: number) {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// --- Sub-components ---

function PricingTab({ allSettings, loading }: { allSettings: any[]; loading: boolean }) {
  const { updateSetting } = usePricing();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleSave = async (key: string) => {
    const val = parseFloat(editValues[key]);
    if (isNaN(val)) return;
    setSaving((p) => ({ ...p, [key]: true }));
    const { error } = await updateSetting(key, val);
    setSaving((p) => ({ ...p, [key]: false }));
    if (error) toast.error("Ошибка сохранения");
    else {
      toast.success("Сохранено");
      setEditValues((p) => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  if (loading) return <div className="animate-pulse text-muted-foreground">Загрузка...</div>;

  const grouped: Record<string, typeof allSettings> = {};
  allSettings.forEach((s) => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, items]) => (
        <motion.div key={category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
          <h2 className="text-lg font-semibold mb-4 text-primary">{CATEGORY_LABELS[category] || category}</h2>
          <div className="space-y-4">
            {items.map((setting: any) => {
              const isEditing = editValues[setting.key] !== undefined;
              const currentValue = isEditing ? editValues[setting.key] : String(setting.value);
              return (
                <div key={setting.key} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="text-sm font-medium block">{setting.label}</label>
                    <span className="text-xs text-muted-foreground">{setting.key}</span>
                  </div>
                  <Input
                    type="number"
                    value={currentValue}
                    onChange={(e) => setEditValues((p) => ({ ...p, [setting.key]: e.target.value }))}
                    className="w-32 bg-secondary border-border text-right"
                    step="any"
                  />
                  {isEditing && (
                    <Button size="sm" onClick={() => handleSave(setting.key)} disabled={saving[setting.key]} className="shrink-0">
                      {saving[setting.key] ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ColorsTab() {
  const { fetchAllColors, addColor, updateColor, deleteColor } = useColors();
  const [allColors, setAllColors] = useState<StandardColor[]>([]);
  const [newColorName, setNewColorName] = useState("");

  useEffect(() => { fetchAllColors().then(setAllColors); }, []);

  const handleAddColor = async () => {
    if (!newColorName.trim()) return;
    const { error } = await addColor(newColorName.trim(), allColors.length + 1);
    if (error) toast.error("Ошибка добавления");
    else { toast.success("Цвет добавлен"); setNewColorName(""); fetchAllColors().then(setAllColors); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
      <h2 className="text-lg font-semibold mb-4 text-primary">Стандартные цвета</h2>
      <div className="space-y-3">
        {allColors.map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <span className={`flex-1 text-sm ${c.is_active ? "" : "text-muted-foreground line-through"}`}>{c.name}</span>
            <Button size="sm" variant={c.is_active ? "secondary" : "outline"} onClick={async () => { await updateColor(c.id, { is_active: !c.is_active }); fetchAllColors().then(setAllColors); }}>
              {c.is_active ? "Активен" : "Выкл"}
            </Button>
            <Button size="sm" variant="ghost" onClick={async () => { await deleteColor(c.id); fetchAllColors().then(setAllColors); }} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      <Separator className="my-4 bg-border/50" />
      <div className="flex gap-2">
        <Input value={newColorName} onChange={(e) => setNewColorName(e.target.value)} placeholder="Новый цвет" className="bg-secondary border-border" />
        <Button onClick={handleAddColor} className="gap-1.5 shrink-0"><Plus className="w-4 h-4" /> Добавить</Button>
      </div>
    </motion.div>
  );
}

function CalculationsTab() {
  const { calculations, loading } = useCalculations();
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
      <h2 className="text-lg font-semibold mb-4 text-primary">Все расчёты</h2>
      {loading ? (
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      ) : calculations.length === 0 ? (
        <p className="text-muted-foreground text-sm">Нет сохранённых расчётов</p>
      ) : (
        <div className="space-y-3">
          {calculations.map((calc) => (
            <div key={calc.id} className="p-4 rounded-lg bg-secondary/50 border border-border/50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  {calc.calc_name && <div className="font-semibold text-primary text-sm">{calc.calc_name}</div>}
                  <span className="text-xs text-muted-foreground">{formatDate(calc.created_at)}</span>
                </div>
                <span className="font-bold text-sm text-primary">{formatPrice(calc.result.totalPrice)} ₽</span>
              </div>
              <div className="text-xs text-muted-foreground">{calc.product_label}</div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CompanySettingsTab() {
  const { settings, updateSetting, loading } = useCompanySettings();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleSave = async (key: string) => {
    const val = editValues[key];
    if (val === undefined) return;
    setSaving((p) => ({ ...p, [key]: true }));
    const { error } = await updateSetting(key, val);
    setSaving((p) => ({ ...p, [key]: false }));
    if (error) toast.error("Ошибка сохранения");
    else {
      toast.success("Сохранено");
      setEditValues((p) => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  if (loading) return <div className="animate-pulse text-muted-foreground">Загрузка...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
      <h2 className="text-lg font-semibold mb-4 text-primary">Контакты и условия</h2>
      <div className="space-y-4">
        {settings.map((s) => {
          const isEditing = editValues[s.key] !== undefined;
          const currentValue = isEditing ? editValues[s.key] : s.value;
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <label className="text-sm font-medium block">{s.label}</label>
                <span className="text-xs text-muted-foreground">{s.key}</span>
              </div>
              <Input
                value={currentValue}
                onChange={(e) => setEditValues((p) => ({ ...p, [s.key]: e.target.value }))}
                className="w-64 bg-secondary border-border text-right"
              />
              {isEditing && (
                <Button size="sm" onClick={() => handleSave(s.key)} disabled={saving[s.key]} className="shrink-0">
                  {saving[s.key] ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// --- Main Admin Page ---

export default function AdminPage() {
  const { allSettings, loading } = usePricing();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold mb-1">Панель администратора</h1>
          <p className="text-muted-foreground text-sm mb-6">Управление ценами, цветами, контактами и расчётами</p>
        </motion.div>

        <Tabs defaultValue="pricing" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="pricing">Цены</TabsTrigger>
            <TabsTrigger value="colors">Цвета</TabsTrigger>
            <TabsTrigger value="company">Контакты</TabsTrigger>
            <TabsTrigger value="calculations">Расчёты</TabsTrigger>
          </TabsList>

          <TabsContent value="pricing"><PricingTab allSettings={allSettings} loading={loading} /></TabsContent>
          <TabsContent value="colors"><ColorsTab /></TabsContent>
          <TabsContent value="company"><CompanySettingsTab /></TabsContent>
          <TabsContent value="calculations"><CalculationsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
