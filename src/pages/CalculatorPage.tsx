import { useState, useRef } from "react";
import { motion } from "framer-motion";
import ProductSelector from "@/components/ProductSelector";
import CalculatorForm from "@/components/CalculatorForm";
import ResultPanel from "@/components/ResultPanel";
import AppLayout from "@/components/AppLayout";
import SaveCalculationDialog from "@/components/SaveCalculationDialog";
import { usePricing } from "@/hooks/usePricing";
import { useColors } from "@/hooks/useColors";
import { useCalculations } from "@/hooks/useCalculations";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useAuth } from "@/hooks/useAuth";
import {
  ProductType,
  CalculationResult,
  calculateCountertop,
  calculateSink,
  calculateSimpleProduct,
  calculateStepSlab,
  calculateWindowsill,
} from "@/lib/calculator";
import { toast } from "sonner";

export default function CalculatorPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [currentParams, setCurrentParams] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const { settings, loading } = usePricing();
  const { colors } = useColors();
  const { saveCalculation } = useCalculations();
  const { getSetting } = useCompanySettings();
  const { user, profile } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const colorNames = colors.map((c) => c.name);

  const handleSelectProduct = (t: string) => {
    setSelectedProduct(t as ProductType);
    setResult(null);
    setSaved(false);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleCalculate = (params: any) => {
    if (!selectedProduct) return;
    setCurrentParams(params);
    setSaved(false);

    let res: CalculationResult;
    if (selectedProduct === "countertop") {
      res = calculateCountertop(params, settings, colorNames);
    } else if (selectedProduct === "sink") {
      res = calculateSink(params, settings, colorNames);
    } else if (selectedProduct === "stepslab") {
      res = calculateStepSlab(params, settings, colorNames);
    } else if (selectedProduct === "windowsill") {
      res = calculateWindowsill(params, settings, colorNames);
    } else {
      res = calculateSimpleProduct(selectedProduct, params, settings, colorNames);
    }
    setResult(res);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleSaveClick = () => {
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = async (calcName: string) => {
    if (!result || !selectedProduct || !currentParams) return;
    setSavingName(true);
    const { error } = await saveCalculation(selectedProduct, result.productLabel, currentParams, result, calcName);
    setSavingName(false);
    setShowSaveDialog(false);
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
          onSelect={handleSelectProduct}
        />

        {selectedProduct && (
          <div ref={formRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <motion.div
              key={selectedProduct}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Параметры</h2>
              <CalculatorForm productType={selectedProduct} onCalculate={handleCalculate} colorNames={colorNames} />
            </motion.div>

            {result && (
              <div ref={resultRef}>
                <ResultPanel
                  result={result}
                  onSave={handleSaveClick}
                  saving={saved}
                  companySettings={{ getSetting }}
                  specialist={{
                    fullName: profile?.full_name || undefined,
                    phone: profile?.phone || undefined,
                    email: user?.email || undefined,
                    telegram: profile?.telegram || undefined,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <SaveCalculationDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onConfirm={handleSaveConfirm}
        saving={savingName}
      />
    </AppLayout>
  );
}
