import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import ProductSelector from "@/components/ProductSelector";
import CalculatorForm from "@/components/CalculatorForm";
import ResultPanel from "@/components/ResultPanel";
import AppLayout from "@/components/AppLayout";
import CartPanel from "@/components/CartPanel";
import BoxCalculatorInline from "@/components/BoxCalculatorInline";
import { usePricing } from "@/hooks/usePricing";
import { useColors } from "@/hooks/useColors";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import {
  ProductType,
  CalculationResult,
  calculateCountertop,
  calculateSink,
  calculateStepSlab,
  calculateWindowsill,
  calculateBacksplash,
  calculateStair,
} from "@/lib/calculator";
import { calculateBox, MaterialSettings } from "@/lib/boxCalculator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CalculatorPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [currentParams, setCurrentParams] = useState<any>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const { settings, loading } = usePricing();
  const { colors } = useColors();
  const { getSetting } = useCompanySettings();
  const { user, profile } = useAuth();
  const { addItem } = useCart();
  const formRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const colorNames = colors.map((c) => c.name);
  const colorsForPrint = colors.map((c) => ({ name: c.name, image_url: c.image_url, show_in_print: c.show_in_print }));

  // Auto-save calculation (silent, no UI feedback)
  const autoSaveCalculation = useCallback(async (productType: string, productLabel: string, params: any, calcResult: CalculationResult) => {
    if (!user) return;
    try {
      await (supabase.from("saved_calculations" as any) as any).insert({
        user_id: user.id,
        product_type: productType,
        product_label: productLabel,
        calc_name: `Авто: ${productLabel.substring(0, 50)}`,
        params,
        result: calcResult,
        is_auto_saved: true,
      });
    } catch {
      // Silent fail - auto-save should not interrupt user
    }
  }, [user]);

  const handleSelectProduct = (t: string) => {
    setSelectedProduct(t as ProductType);
    setResult(null);
    setAddedToCart(false);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleCalculate = (params: any) => {
    if (!selectedProduct || selectedProduct === "box") return;
    const { needsBox, includeInstallation = true, includeSupport = true, ...calcParams } = params;
    setCurrentParams(params);
    setAddedToCart(false);


    let res: CalculationResult;
    if (selectedProduct === "countertop") {
      res = calculateCountertop(calcParams, settings, colorNames);
    } else if (selectedProduct === "sink") {
      res = calculateSink(calcParams, settings, colorNames);
    } else if (selectedProduct === "stepslab") {
      res = calculateStepSlab(calcParams, settings, colorNames);
    } else if (selectedProduct === "windowsill") {
      res = calculateWindowsill(calcParams, settings, colorNames);
    } else if (selectedProduct === "backsplash") {
      res = calculateBacksplash(calcParams, settings, colorNames);
    } else if (selectedProduct === "stair") {
      res = calculateStair(calcParams, settings, colorNames);
    } else {
      return;
    }

    if (needsBox) {
      let itemL: number, itemW: number, itemH: number;
      if (calcParams.isRound && calcParams.diameter) {
        itemL = calcParams.diameter;
        itemW = calcParams.diameter;
      } else if (selectedProduct === "backsplash") {
        itemL = calcParams.width || 2500;
        itemW = calcParams.height || 600;
      } else {
        itemL = calcParams.length || calcParams.width || 1000;
        itemW = calcParams.width || calcParams.length || 600;
      }
      itemH = calcParams.thickness || calcParams.thicknessConcrete || 30;

      const foamThickness = (res.weight / res.quantity) <= 50 ? 10 : 20;
      const boxMaterials: MaterialSettings = {
        osp: { length: settings.box_osp_length || 2500, width: settings.box_osp_width || 1250, thickness: settings.box_osp_thickness || 9, price: settings.box_osp_price || 565 },
        foam: { length: settings.box_foam_length || 1185, width: settings.box_foam_width || 585, thickness: foamThickness, price: settings.box_foam_price || 110 },
        beam: { width: settings.box_beam_width || 40, height: settings.box_beam_height || 30, standardLength: settings.box_beam_length || 3000, price: settings.box_beam_price || 200 },
      };

      const qty = res.quantity || 1;
      const boxResult = calculateBox(itemL, itemW, itemH, qty, boxMaterials);
      const workMultiplier = settings.box_work_multiplier || 0.6;
      const materialCost = boxResult.costs.total;
      const totalBoxPrice = Math.round(materialCost * (1 + workMultiplier));

      res.boxLabel = `Ящик транспортировочный (${boxResult.dimensions.ospBottomL.toFixed(0)}×${boxResult.dimensions.ospBottomW.toFixed(0)}×${boxResult.dimensions.ospLongSideH.toFixed(0)} мм)`;
      res.boxPrice = totalBoxPrice;
      res.grandTotal += totalBoxPrice;
    }

    setResult(res);

    // Auto-save every calculation
    autoSaveCalculation(selectedProduct, res.productLabel, calcParams, res);

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleAddToCart = () => {
    if (!result || !selectedProduct || !currentParams) return;
    addItem(selectedProduct, result.productLabel, currentParams, result);
    setAddedToCart(true);
    toast.success("Добавлено в корзину");
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
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold">Калькулятор стоимости</h1>
            <CartPanel />
          </div>
          <p className="text-muted-foreground text-sm mb-6">Выберите тип изделия и укажите параметры</p>
        </motion.div>

        <ProductSelector selected={selectedProduct} onSelect={handleSelectProduct} />

        {selectedProduct === "box" && (
          <div ref={formRef}>
            <BoxCalculatorInline />
          </div>
        )}

        {selectedProduct && selectedProduct !== "box" && (
          <div ref={formRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <motion.div key={selectedProduct} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
              <h2 className="text-lg font-semibold mb-4">Параметры</h2>
              <CalculatorForm productType={selectedProduct} onCalculate={handleCalculate} colorNames={colorNames} pricing={settings} />
            </motion.div>

            {result && (
              <div ref={resultRef}>
                <ResultPanel
                  result={result}
                  onSave={handleAddToCart}
                  saving={addedToCart}
                  saveLabel={addedToCart ? "В корзине ✓" : "В корзину"}
                  saveIcon="cart"
                  companySettings={{ getSetting }}
                  specialist={{
                    fullName: profile?.full_name || undefined,
                    phone: profile?.phone || undefined,
                    email: user?.email || undefined,
                    telegram: profile?.telegram || undefined,
                  }}
                  colorsForPrint={colorsForPrint}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
