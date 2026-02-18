import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useCalculations } from "@/hooks/useCalculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

function formatPrice(num: number) {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CalculationsTab() {
  const { calculations, loading, deleteCalculation } = useCalculations();
  const [search, setSearch] = useState("");
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Fetch user names for all unique user_ids
  useEffect(() => {
    const userIds = [...new Set(calculations.map(c => c.user_id))];
    if (userIds.length === 0) return;
    supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          (data as any[]).forEach(p => { map[p.user_id] = p.full_name || "Без имени"; });
          setUserNames(map);
        }
      });
  }, [calculations]);

  const handleDelete = async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id));
    const { error } = await deleteCalculation(id);
    if (error) {
      toast.error("Ошибка удаления");
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    } else {
      toast.success("Расчёт удалён");
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return calculations;
    const q = search.toLowerCase();
    return calculations.filter(c =>
      (c.calc_name && c.calc_name.toLowerCase().includes(q)) ||
      c.product_label.toLowerCase().includes(q) ||
      c.product_type.toLowerCase().includes(q) ||
      (userNames[c.user_id] && userNames[c.user_id].toLowerCase().includes(q))
    );
  }, [calculations, search, userNames]);

  const visible = filtered.filter(c => !deletingIds.has(c.id));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
      <h2 className="text-lg font-semibold mb-4 text-primary">Все расчёты</h2>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию, изделию, специалисту..."
          className="pl-9 bg-secondary border-border"
        />
      </div>

      {loading ? (
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {calculations.length === 0 ? "Нет сохранённых расчётов" : "Ничего не найдено"}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((calc) => (
            <div key={calc.id} className="p-4 rounded-lg bg-secondary/50 border border-border/50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  {calc.calc_name && <div className="font-semibold text-primary text-sm">{calc.calc_name}</div>}
                  <span className="text-xs text-muted-foreground">{formatDate(calc.created_at)}</span>
                  {userNames[calc.user_id] && (
                    <span className="text-xs text-muted-foreground ml-2">· {userNames[calc.user_id]}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-primary whitespace-nowrap">{formatPrice(calc.result.totalPrice)} ₽</span>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(calc.id)} className="text-muted-foreground hover:text-destructive h-8 w-8 p-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{calc.product_label}</div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
