import { useState } from "react";
import { motion } from "framer-motion";
import { usePricing } from "@/hooks/usePricing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const CATEGORY_LABELS: Record<string, string> = {
  general: "Общие параметры",
  countertop: "Столешница",
  sink: "Раковина",
  windowsill: "Подоконник",
  backsplash: "Фартук",
  stair: "Ступени",
  stepslab: "Пошаговая плита",
};

const CATEGORY_ORDER = ["general", "countertop", "sink", "windowsill", "backsplash", "stair", "stepslab"];

interface Props {
  allSettings: any[];
  loading: boolean;
}

export default function PricingTab({ allSettings, loading }: Props) {
  const { updateSetting } = usePricing();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setOpenCategories((p) => ({ ...p, [cat]: !p[cat] }));
  };

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
  // Sort categories by defined order
  const sortedEntries = Object.entries(grouped).sort(([a], [b]) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  return (
    <div className="space-y-3">
      {sortedEntries.map(([category, items]) => (
        <Collapsible
          key={category}
          open={openCategories[category] ?? false}
          onOpenChange={() => toggleCategory(category)}
        >
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors cursor-pointer">
              <h2 className="text-base font-semibold text-primary">{CATEGORY_LABELS[category] || category}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{items.length} параметров</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openCategories[category] ? "rotate-180" : ""}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
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
            </CollapsibleContent>
          </motion.div>
        </Collapsible>
      ))}
    </div>
  );
}
