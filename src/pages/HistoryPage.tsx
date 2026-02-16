import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { useCalculations } from "@/hooks/useCalculations";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatPrice(num: number) {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function HistoryPage() {
  const { calculations, loading, deleteCalculation } = useCalculations();

  const handleDelete = async (id: string) => {
    const { error } = await deleteCalculation(id);
    if (error) toast.error("Ошибка удаления");
    else toast.success("Удалено");
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold mb-1">Мои расчёты</h1>
          <p className="text-muted-foreground text-sm mb-6">История сохранённых расчётов</p>
        </motion.div>

        {loading ? (
          <div className="animate-pulse text-muted-foreground">Загрузка...</div>
        ) : calculations.length === 0 ? (
          <div className="glass-panel p-8 text-center text-muted-foreground">
            Нет сохранённых расчётов. Сделайте расчёт и нажмите «Сохранить».
          </div>
        ) : (
          <div className="space-y-3">
            {calculations.map((calc) => (
              <motion.div
                key={calc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-4"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    {calc.calc_name && (
                      <div className="font-semibold text-primary text-sm mb-1">{calc.calc_name}</div>
                    )}
                    <div className="text-xs text-muted-foreground mb-2">{formatDate(calc.created_at)}</div>
                    <div className="text-sm leading-relaxed">{calc.product_label}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(calc.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Стоимость изделия</span>
                    <span className="font-medium">{formatPrice(calc.result.totalPrice)} ₽</span>
                  </div>
                  {calc.result.supportPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Кронштейн</span>
                      <span>{formatPrice(calc.result.supportPrice)} ₽</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Монтаж</span>
                    <span>{formatPrice(calc.result.installationPrice)} ₽</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
