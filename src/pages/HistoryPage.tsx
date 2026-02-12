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
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{calc.product_label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{formatDate(calc.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">{formatPrice(calc.result.grandTotal)} ₽</span>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(calc.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-x-3">
                  <span>Площадь: {calc.result.area} м²</span>
                  <span>Вес: {calc.result.weight} кг</span>
                  {calc.result.quantity > 1 && <span>Кол-во: {calc.result.quantity}</span>}
                  <span>Монтаж: {formatPrice(calc.result.installationPrice)} ₽</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
