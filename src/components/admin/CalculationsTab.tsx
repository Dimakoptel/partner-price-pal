import { motion } from "framer-motion";
import { useCalculations } from "@/hooks/useCalculations";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

function formatPrice(num: number) {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CalculationsTab() {
  const { calculations, loading, deleteCalculation } = useCalculations();

  const handleDelete = async (id: string) => {
    const { error } = await deleteCalculation(id);
    if (error) toast.error("Ошибка удаления");
    else toast.success("Расчёт удалён");
  };

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
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-primary">{formatPrice(calc.result.totalPrice)} ₽</span>
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
