import { useState } from "react";
import { motion } from "framer-motion";
import ProductSelector from "@/components/ProductSelector";
import CalculatorForm from "@/components/CalculatorForm";
import ResultPanel from "@/components/ResultPanel";
import AppLayout from "@/components/AppLayout";
import { usePricing } from "@/hooks/usePricing";
import { useColors } from "@/hooks/useColors";
import { useCalculations } from "@/hooks/useCalculations";
import {
  ProductType,
  CalculationResult,
  calculateCountertop,
  calculateSink,
  calculateSimpleProduct,
} from "@/lib/calculator";
import { toast } from "sonner";

export default function CalculatorPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [currentParams, setCurrentParams] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const { settings, loading } = usePricing();
  const { colors } = useColors();
  const { saveCalculation } = useCalculations();

  const colorNames = colors.map((c) => c.name);

  const handleCalculate = (params: any) => {
    if (!selectedProduct) return;
    setCurrentParams(params);
    setSaved(false);

    let res: CalculationResult;
    if (selectedProduct === "countertop") {
      res = calculateCountertop(params, settings, colorNames);
    } else if (selectedProduct === "sink") {
      res = calculateSink(params, settings, colorNames);
    } else {
      res = calculateSimpleProduct(selectedProduct, params, settings, colorNames);
    }
    setResult(res);
  };

  const handleSave = async () => {
    if (!result || !selectedProduct || !currentParams) return;
    const { error } = await saveCalculation(selectedProduct, result.productLabel, currentParams, result);
    if (error) {
      toast.error("Ошибка сохранения");
    } else {
      setSaved(true);
      toast.success("Расчёт сохранён");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Загрузка настроек...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold mb-1">Калькулятор стоимости</h1>
          <p className="text-muted-foreground text-sm mb-6">Выберите тип изделия и укажите параметры</p>
        </motion.div>

        <ProductSelector
          selected={selectedProduct}
          onSelect={(t) => { setSelectedProduct(t as ProductType); setResult(null); setSaved(false); }}
        />

        {selectedProduct && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <motion.div
              key={selectedProduct}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Параметры</h2>
              <CalculatorForm productType={selectedProduct} onCalculate={handleCalculate} colorNames={colorNames} />
            </motion.div>

            {result && <ResultPanel result={result} onSave={handleSave} saving={saved} />}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
