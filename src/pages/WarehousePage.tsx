import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Warehouse, Package, ArrowDownToLine, ArrowUpFromLine, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useInventory, useStockMovements } from "@/hooks/useInventory";
import InventoryTable from "@/components/warehouse/InventoryTable";
import MovementsTable from "@/components/warehouse/MovementsTable";
import StockMovementDialog from "@/components/warehouse/StockMovementDialog";

export default function WarehousePage() {
  const { data: inventory = [], isLoading: invLoading } = useInventory();
  const { data: movements = [], isLoading: movLoading } = useStockMovements();
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [presetType, setPresetType] = useState<string | undefined>();

  const totalOnHand = inventory.reduce((s, i) => s + i.quantity_on_hand, 0);
  const totalReserved = inventory.reduce((s, i) => s + i.quantity_reserved, 0);
  const lowStockCount = inventory.filter((i) => i.min_stock_level > 0 && (i.quantity_on_hand - i.quantity_reserved) <= i.min_stock_level).length;

  const openMovement = (type?: string) => {
    setPresetType(type);
    setMovementDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10">
                <Warehouse className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-light tracking-tight">Склад</h1>
                <p className="text-sm text-muted-foreground">Учёт материалов и готовой продукции</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openMovement("receipt")} className="gap-1.5">
                <ArrowDownToLine className="w-4 h-4" /> Приход
              </Button>
              <Button variant="outline" size="sm" onClick={() => openMovement("dispatch")} className="gap-1.5">
                <ArrowUpFromLine className="w-4 h-4" /> Расход
              </Button>
              <Button size="sm" onClick={() => openMovement()} className="gap-1.5">
                <Plus className="w-4 h-4" /> Движение
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Позиций на складе", value: inventory.length.toString() },
            { label: "Всего единиц", value: totalOnHand.toString() },
            { label: "В резерве", value: totalReserved.toString() },
            { label: "Мало на складе", value: lowStockCount.toString(), warn: lowStockCount > 0 },
          ].map((stat) => (
            <div key={stat.label} className="border border-border p-3 bg-card">
              <div className={`text-2xl font-light ${(stat as any).warn ? "text-amber-500" : ""}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList className="bg-secondary h-auto gap-1 p-1.5">
            <TabsTrigger value="inventory" className="text-xs gap-1.5">
              <Package className="w-3 h-3" /> Остатки
            </TabsTrigger>
            <TabsTrigger value="movements" className="text-xs gap-1.5">
              <ArrowDownToLine className="w-3 h-3" /> Движения ({movements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            {invLoading ? (
              <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
            ) : (
              <InventoryTable items={inventory} />
            )}
          </TabsContent>

          <TabsContent value="movements">
            {movLoading ? (
              <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
            ) : (
              <MovementsTable movements={movements} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <StockMovementDialog
        open={movementDialogOpen}
        onOpenChange={setMovementDialogOpen}
        presetType={presetType}
      />
    </AppLayout>
  );
}
