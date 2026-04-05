import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { usePricing } from "@/hooks/usePricing";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calculator } from "lucide-react";
import CalculatorForm from "@/components/CalculatorForm";
import ResultPanel from "@/components/ResultPanel";
import { useCompanySettings } from "@/hooks/useCompanySettings";
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

interface PartnerRequest {
  id: string;
  number: string;
  client_id: string;
  user_id: string;
  product_type: string | null;
  params: Record<string, any>;
  status: string;
  retail_price: number | null;
  partner_price: number | null;
  notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PartnerRequest;
  onDone: () => void;
}

const PRODUCT_LABELS: Record<string, string> = {
  countertop: "Столешница",
  sink: "Мойка",
  windowsill: "Подоконник",
  stepslab: "Ступень (накладная)",
  backsplash: "Фартук",
  stair: "Ступень (монолит)",
};

export default function ManagerRequestCalculateDialog({ open, onOpenChange, request, onDone }: Props) {
  const { user, profile } = useAuth();
  const { settings } = usePricing();
  const { colors } = useColors();
  const { getSetting } = useCompanySettings();
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [currentParams, setCurrentParams] = useState<any>(null);
  const [sending, setSending] = useState(false);

  const colorNames = colors.map(c => c.name);
  const colorsForPrint = colors.map(c => ({ name: c.name, image_url: c.image_url, show_in_print: c.show_in_print }));
  const productType = request.product_type as ProductType | null;

  const handleCalculate = useCallback((params: any) => {
    if (!productType || productType === "box") return;
    const { needsBox, ...calcParams } = params;
    setCurrentParams(params);

    let res: CalculationResult;
    if (productType === "countertop") res = calculateCountertop(calcParams, settings, colorNames);
    else if (productType === "sink") res = calculateSink(calcParams, settings, colorNames);
    else if (productType === "stepslab") res = calculateStepSlab(calcParams, settings, colorNames);
    else if (productType === "windowsill") res = calculateWindowsill(calcParams, settings, colorNames);
    else if (productType === "backsplash") res = calculateBacksplash(calcParams, settings, colorNames);
    else if (productType === "stair") res = calculateStair(calcParams, settings, colorNames);
    else return;

    if (needsBox) {
      let itemL: number, itemW: number, itemH: number;
      if (calcParams.isRound && calcParams.diameter) {
        itemL = calcParams.diameter;
        itemW = calcParams.diameter;
      } else if (productType === "backsplash") {
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
  }, [productType, settings, colorNames]);

  const handleSendToPartner = async () => {
    if (!result || !user) return;
    setSending(true);
    try {
      // Save calculation linked to partner request
      await (supabase.from("saved_calculations" as any) as any).insert({
        user_id: user.id,
        product_type: productType,
        product_label: result.productLabel,
        calc_name: `Запрос ${request.number}`,
        params: currentParams,
        result: result,
        is_auto_saved: false,
        client_id: request.client_id,
        partner_request_id: request.id,
      });

      // Update partner request with prices and status
      await (supabase.from("partner_requests" as any) as any)
        .update({
          retail_price: result.grandTotal,
          partner_price: result.grandTotal, // Manager can adjust
          status: "quoted",
        })
        .eq("id", request.id);

      // Send a message to the chat
      await (supabase.from("partner_request_messages" as any) as any)
        .insert({
          request_id: request.id,
          user_id: user.id,
          message: `Расчёт выполнен: ${result.productLabel}\nИтого: ${result.grandTotal.toLocaleString("ru-RU")} ₽`,
          attachment_urls: [],
        });

      toast.success("Расчёт отправлен партнёру");
      onDone();
    } catch (err: any) {
      toast.error("Ошибка: " + (err?.message || "Не удалось сохранить"));
    } finally {
      setSending(false);
    }
  };

  if (!productType || productType === "box") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Невозможно рассчитать</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Тип изделия не указан в запросе партнёра.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Расчёт по запросу {request.number}</DialogTitle>
            <Badge variant="outline">{PRODUCT_LABELS[productType] || productType}</Badge>
          </div>
        </DialogHeader>

        {/* Partner params summary */}
        <div className="bg-muted/50 p-3 border border-border text-sm mb-2">
          <div className="text-xs font-medium text-muted-foreground mb-1 uppercase">Параметры от партнёра</div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(request.params || {}).map(([key, val]) => {
              if (val === false || val === "" || val === null || val === undefined) return null;
              return (
                <div key={key}>
                  <span className="text-muted-foreground">{key}: </span>
                  <span className="font-medium">{val === true ? "Да" : String(val)}</span>
                </div>
              );
            })}
          </div>
          {request.notes && <p className="mt-2 text-muted-foreground italic">{request.notes}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-border p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Параметры расчёта
            </h3>
            <CalculatorForm
              productType={productType}
              onCalculate={handleCalculate}
              colorNames={colorNames}
              pricing={settings}
            />
          </div>

          {result && (
            <div>
              <ResultPanel
                result={result}
                onSave={handleSendToPartner}
                saving={sending}
                saveLabel={sending ? "Отправка..." : "Отправить партнёру"}
                saveIcon="send"
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
      </DialogContent>
    </Dialog>
  );
}
