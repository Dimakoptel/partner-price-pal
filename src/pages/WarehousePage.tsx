import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Warehouse } from "lucide-react";

export default function WarehousePage() {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-light text-foreground tracking-tight">
            Склад
          </h1>
          <p className="text-muted-foreground text-sm mt-2 mb-8">
            Учёт материалов и готовой продукции
          </p>
        </motion.div>
        <div className="border border-border p-12 bg-card text-center">
          <Warehouse className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-sm font-medium mb-2">Раздел в разработке</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Здесь будет складской учёт: остатки, приход, расход, инвентаризация
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
