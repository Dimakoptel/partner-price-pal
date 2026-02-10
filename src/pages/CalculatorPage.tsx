import { useState } from "react";
import { motion } from "framer-motion";
import ProductSelector from "@/components/ProductSelector";
import CalculatorForm from "@/components/CalculatorForm";
import ResultPanel from "@/components/ResultPanel";
import AppLayout from "@/components/AppLayout";
import { usePricing } from "@/hooks/usePricing";
import {
  ProductType,
  CalculationResult,
  calculateCountertop,
  calculateSink,
  calculateSimpleProduct,
} from "@/lib/calculator";

export default function CalculatorPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const { settings, loading } = usePricing();

  const handleCalculate = (params: any) => {
    if (!selectedProduct) return;

    let res: CalculationResult;
    if (selectedProduct === "countertop") {
      res = calculateCountertop(params, settings);
    } else if (selectedProduct === "sink") {
      res = calculateSink(params, settings);
    } else {
      res = calculateSimpleProduct(selectedProduct, params, settings);
    }
    setResult(res);
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
          onSelect={(t) => { setSelectedProduct(t as ProductType); setResult(null); }}
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
              <CalculatorForm productType={selectedProduct} onCalculate={handleCalculate} />
            </motion.div>

            {result && <ResultPanel result={result} />}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
