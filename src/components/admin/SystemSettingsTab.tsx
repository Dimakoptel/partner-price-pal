import { useState, useMemo, useEffect } from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Save, Trash2, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["general", "orders", "warehouse", "production", "sales", "integrations", "other"];
const VALUE_TYPES = ["number", "string", "boolean", "json"];

export default function SystemSettingsTab() {
  const { settings, isLoading, updateSetting } = useSystemSettings();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openNew, setOpenNew] = useState(false);
  const [newRow, setNewRow] = useState({
    key: "", label: "", value: "", value_type: "string", category: "general", description: "",
  });

  useEffect(() => {
    const d: Record<string, string> = {};
    settings.forEach((s) => { d[s.key] = s.value ?? ""; });
    setDrafts(d);
  }, [settings]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof settings> = {};
    settings.forEach((s) => {
      const cat = s.category || "other";
      (map[cat] ??= []).push(s);
    });
    return map;
  }, [settings]);

  const handleSave = async (key: string) => {
    try {
      await updateSetting.mutateAsync({ key, value: drafts[key] ?? "" });
      toast.success("Сохранено");
    } catch (e: any) {
      toast.error(e.message || "Ошибка сохранения");
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Удалить настройку "${key}"? Это может повлиять на работу системы.`)) return;
    const { error } = await supabase.from("system_settings").delete().eq("key", key);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["system_settings"] });
  };

  const handleCreate = async () => {
    if (!newRow.key || !newRow.label) {
      toast.error("Заполните ключ и название");
      return;
    }
    const { error } = await supabase.from("system_settings").insert({
      key: newRow.key.trim(),
      label: newRow.label.trim(),
      value: newRow.value,
      value_type: newRow.value_type,
      category: newRow.category,
      description: newRow.description || null,
      updated_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Настройка создана");
    setOpenNew(false);
    setNewRow({ key: "", label: "", value: "", value_type: "string", category: "general", description: "" });
    qc.invalidateQueries({ queryKey: ["system_settings"] });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Загрузка...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-light flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" /> Системные настройки
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Глобальные параметры приложения. Изменения применяются сразу.
          </p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Добавить</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая системная настройка</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Ключ (latin, snake_case)</Label>
                <Input value={newRow.key} onChange={(e) => setNewRow({ ...newRow, key: e.target.value })} placeholder="my_setting_key" />
              </div>
              <div>
                <Label>Название</Label>
                <Input value={newRow.label} onChange={(e) => setNewRow({ ...newRow, label: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Категория</Label>
                  <Select value={newRow.category} onValueChange={(v) => setNewRow({ ...newRow, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Тип значения</Label>
                  <Select value={newRow.value_type} onValueChange={(v) => setNewRow({ ...newRow, value_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VALUE_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Значение</Label>
                <Input value={newRow.value} onChange={(e) => setNewRow({ ...newRow, value: e.target.value })} />
              </div>
              <div>
                <Label>Описание</Label>
                <Textarea value={newRow.description} onChange={(e) => setNewRow({ ...newRow, description: e.target.value })} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenNew(false)}>Отмена</Button>
              <Button onClick={handleCreate}>Создать</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat}>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">{cat}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((s) => (
              <div key={s.key} className="grid grid-cols-1 md:grid-cols-[1fr_280px_auto] gap-3 items-end pb-3 border-b border-border last:border-0">
                <div>
                  <Label className="text-xs">{s.label || s.key}</Label>
                  <p className="text-[10px] text-muted-foreground font-mono">{s.key} · {s.value_type}</p>
                  {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                </div>
                <div>
                  {s.value_type === "boolean" ? (
                    <div className="flex items-center gap-2 h-9">
                      <Switch
                        checked={drafts[s.key] === "true"}
                        onCheckedChange={(v) => setDrafts({ ...drafts, [s.key]: v ? "true" : "false" })}
                      />
                      <span className="text-xs text-muted-foreground">{drafts[s.key] === "true" ? "Вкл" : "Выкл"}</span>
                    </div>
                  ) : s.value_type === "json" ? (
                    <Textarea
                      value={drafts[s.key] ?? ""}
                      onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })}
                      rows={3}
                      className="font-mono text-xs"
                    />
                  ) : (
                    <Input
                      type={s.value_type === "number" ? "number" : "text"}
                      value={drafts[s.key] ?? ""}
                      onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })}
                    />
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSave(s.key)}
                    disabled={drafts[s.key] === s.value}
                    className="gap-1"
                  >
                    <Save className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(s.key)} className="text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
