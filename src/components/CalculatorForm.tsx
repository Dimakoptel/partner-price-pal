import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { CountertopParams, SinkParams, StairParams, StepSlabParams, WindowsillParams, BacksplashParams, ProductType, validateSinkParams, SinkValidationError, validateCountertopParams, CountertopValidationError, validateStepSlabParams, StepSlabValidationError, validateWindowsillParams, WindowsillValidationError, validateBacksplashParams, BacksplashValidationError, validateStairParams, StairValidationError } from "@/lib/calculator";
import { Calculator, AlertTriangle } from "lucide-react";

interface Props {
  productType: ProductType;
  onCalculate: (params: any) => void;
  colorNames?: string[];
  pricing?: Record<string, number>;
}

export default function CalculatorForm({ productType, onCalculate, colorNames = [], pricing = {} }: Props) {
  const p = pricing;

  // Dynamic limits from pricing settings
  const CT_MIN_LEN = p.countertop_min_length || 500;
  const CT_MAX_LEN = p.countertop_max_length || 3500;
  const CT_MIN_W = p.countertop_min_width || 200;
  const CT_MAX_W = p.countertop_max_width || 1500;
  const CT_MIN_D = p.countertop_min_diameter || 500;
  const CT_MAX_D = p.countertop_max_diameter || 3000;
  const CT_MIN_T = p.countertop_min_thickness || 20;
  const CT_MAX_T = p.countertop_max_thickness || 50;
  const CT_MAX_DROP = p.countertop_max_drop || 300;
  const CT_MAX_SUP = p.countertop_max_support || 1200;

  const WS_MIN_T = p.windowsill_min_thickness || 15;
  const WS_MAX_T = p.windowsill_max_thickness || 50;
  const WS_MAX_DROP = p.windowsill_max_drop || 200;

  const BS_MIN_W = p.backsplash_min_width || 100;
  const BS_MAX_W = p.backsplash_max_width || 6000;
  const BS_MIN_H = p.backsplash_min_height || 300;
  const BS_MAX_H = p.backsplash_max_height || 1000;
  const BS_MIN_T = p.backsplash_min_thickness || 10;
  const BS_MAX_T = p.backsplash_max_thickness || 15;

  const SK_MIN_L = p.sink_min_length || 500;
  const SK_MAX_L = p.sink_max_length || 4000;
  const SK_MIN_W = p.sink_min_width || 300;
  const SK_MAX_W = p.sink_max_width || 1500;
  const SK_MAX_BOWLS = p.sink_max_bowls || 5;
  const SK_MAX_OH = p.sink_max_overhang || 300;

  const ST_MIN_T = p.stair_min_thickness || 30;
  const ST_MAX_T = p.stair_max_thickness || 40;
  const ST_MIN_RH = p.stair_min_riser_height || 100;
  const ST_MAX_RH = p.stair_max_riser_height || 300;

  const SS_MIN_L = p.stepslab_min_length || 500;
  const SS_MAX_L = p.stepslab_max_length || 3500;
  const SS_MIN_W = p.stepslab_min_width || 200;
  const SS_MAX_W = p.stepslab_max_width || 1500;
  const SS_MIN_T = p.stepslab_min_thickness || 40;
  const SS_MAX_T = p.stepslab_max_thickness || 60;
  const SS_MAX_TOTAL = p.stepslab_max_total_thickness || 80;
  const SS_SUBSTRATE = p.stepslab_substrate_thickness || 20;

  const [length, setLength] = useState(1000);
  const [width, setWidth] = useState(600);
  const [diameter, setDiameter] = useState(800);
  const [isRound, setIsRound] = useState(false);
  const [thickness, setThickness] = useState(productType === "backsplash" ? BS_MAX_T : 30);
  const [backsplashWidth, setBacksplashWidth] = useState(2500);
  const [backsplashHeight, setBacksplashHeight] = useState(600);
  const [color, setColor] = useState("серый");
  const [customColor, setCustomColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [dropFront, setDropFront] = useState(0);
  const [dropBack, setDropBack] = useState(0);
  const [dropLeft, setDropLeft] = useState(0);
  const [dropRight, setDropRight] = useState(0);
  const [supportLeft, setSupportLeft] = useState(0);
  const [supportRight, setSupportRight] = useState(0);
  const [bowlCount, setBowlCount] = useState(1);
  const [bowlLength, setBowlLength] = useState(600);
  const [bowlWidth, setBowlWidth] = useState(350);
  const [bowlDepth, setBowlDepth] = useState(100);
  const [maxBowlSize, setMaxBowlSize] = useState(false);
  const [overhangHeight, setOverhangHeight] = useState(0);
  const [ohFront, setOhFront] = useState(true);
  const [ohBack, setOhBack] = useState(false);
  const [ohLeft, setOhLeft] = useState(false);
  const [ohRight, setOhRight] = useState(false);
  const [drainType, setDrainType] = useState("щелевой");
  const [mixerMount, setMixerMount] = useState<"на столешнице" | "на стене">("на столешнице");
  const [hasRiser, setHasRiser] = useState(false);
  const [riserHeight, setRiserHeight] = useState(180);
  const [riserThickness, setRiserThickness] = useState(15);
  const [isHeated, setIsHeated] = useState(false);
  const [thicknessConcrete, setThicknessConcrete] = useState(40);
  const [needsBox, setNeedsBox] = useState(false);
  const [includeInstallation, setIncludeInstallation] = useState(true);
  const [includeSupport, setIncludeSupport] = useState(true);
  const [validationErrors, setValidationErrors] = useState<(SinkValidationError | CountertopValidationError | StepSlabValidationError | WindowsillValidationError | BacksplashValidationError | StairValidationError)[]>([]);
  const finalColor = color === "другой" ? customColor : color;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    if (productType === "countertop") {
      const params: CountertopParams = {
        length, width, diameter, isRound, thickness, color: finalColor, quantity,
        drops: { front: dropFront, back: dropBack, left: dropLeft, right: dropRight },
        supports: { left: supportLeft, right: supportRight },
      };
      const errors = validateCountertopParams(params, pricing);
      if (errors.length > 0) { setValidationErrors(errors); return; }
      onCalculate({ ...params, needsBox, includeInstallation, includeSupport });
    } else if (productType === "sink") {
      const params: SinkParams = {
        length, width, quantity, overhangHeight,
        overhangSides: { front: ohFront, back: ohBack, left: ohLeft, right: ohRight },
        bowlCount,
        bowlLength: maxBowlSize ? undefined : bowlLength,
        bowlWidth: maxBowlSize ? undefined : bowlWidth,
        bowlDepth, maxBowlSize,
        color: finalColor, drainType, mixerMount,
      };
      const errors = validateSinkParams(params, pricing);
      if (errors.length > 0) { setValidationErrors(errors); return; }
      onCalculate({ ...params, needsBox, includeInstallation, includeSupport });
    } else if (productType === "stepslab") {
      const params: StepSlabParams = {
        length, width, thicknessConcrete, color: finalColor, quantity, isHeated,
      };
      const errors = validateStepSlabParams(params, pricing);
      if (errors.length > 0) { setValidationErrors(errors); return; }
      onCalculate({ ...params, needsBox, includeInstallation, includeSupport });
    } else if (productType === "windowsill") {
      const params: WindowsillParams = {
        length, width, thickness, color: finalColor, quantity,
        drops: { front: dropFront, left: dropLeft, right: dropRight },
      };
      const errors = validateWindowsillParams(params, pricing);
      if (errors.length > 0) { setValidationErrors(errors); return; }
      onCalculate({ ...params, needsBox, includeInstallation, includeSupport });
    } else if (productType === "backsplash") {
      const params: BacksplashParams = {
        width: backsplashWidth, height: backsplashHeight, thickness, color: finalColor, quantity,
      };
      const errors = validateBacksplashParams(params, pricing);
      if (errors.length > 0) { setValidationErrors(errors); return; }
      onCalculate({ ...params, needsBox, includeInstallation, includeSupport });
    } else if (productType === "stair") {
      const params: StairParams = {
        length, width, thickness, color: finalColor, quantity,
        hasRiser,
        riserHeight: hasRiser ? riserHeight : 0,
        riserThickness: hasRiser ? riserThickness : 15,
      };
      const errors = validateStairParams(params, pricing);
      if (errors.length > 0) { setValidationErrors(errors); return; }
      onCalculate({ ...params, needsBox, includeInstallation, includeSupport });
    }
  };

  const inputClass = "bg-secondary border-border";
  const availableColors = colorNames.length > 0 ? colorNames : [
    "белоснежный", "белый", "светло-серый", "серый", "темно-серый",
    "зеленый", "бежевый", "коричневый", "желтый", "терракотовый",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dimensions */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Размеры</h3>

        {productType === "countertop" && (
          <div className="flex items-center gap-3 mb-4">
            <Switch checked={isRound} onCheckedChange={setIsRound} />
            <Label className="text-sm">Круглая столешница</Label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {productType === "backsplash" ? (
            <>
              <div>
                <Label className="text-xs">Ширина (мм)</Label>
                <NumericInput value={backsplashWidth} onValueChange={setBacksplashWidth} min={BS_MIN_W} max={BS_MAX_W} className={inputClass} />
                <p className="text-[10px] text-muted-foreground mt-1">{BS_MIN_W}–{BS_MAX_W} мм</p>
              </div>
              <div>
                <Label className="text-xs">Высота (мм)</Label>
                <NumericInput value={backsplashHeight} onValueChange={setBacksplashHeight} min={BS_MIN_H} max={BS_MAX_H} className={inputClass} />
                <p className="text-[10px] text-muted-foreground mt-1">{BS_MIN_H}–{BS_MAX_H} мм</p>
              </div>
              <div>
                <Label className="text-xs">Толщина (мм)</Label>
                <NumericInput value={thickness} onValueChange={setThickness} min={BS_MIN_T} max={BS_MAX_T} className={inputClass} />
                <p className="text-[10px] text-muted-foreground mt-1">{BS_MIN_T}–{BS_MAX_T} мм</p>
                {thickness < (p.backsplash_standard_thickness || 15) && thickness >= BS_MIN_T && (
                  <p className="text-[10px] text-amber-500 mt-1">⚠️ Нестандартная толщина, требует согласования</p>
                )}
              </div>
            </>
          ) : productType === "countertop" && isRound ? (
            <div>
              <Label className="text-xs">Диаметр (мм)</Label>
              <NumericInput value={diameter} onValueChange={setDiameter} min={CT_MIN_D} max={CT_MAX_D} className={inputClass} />
              <p className="text-[10px] text-muted-foreground mt-1">{CT_MIN_D}–{CT_MAX_D} мм</p>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-xs">Длина (мм)</Label>
                <NumericInput
                  value={length}
                  onValueChange={setLength}
                  min={productType === "sink" ? SK_MIN_L : productType === "stepslab" ? SS_MIN_L : CT_MIN_LEN}
                  max={productType === "sink" ? SK_MAX_L : productType === "stepslab" ? SS_MAX_L : CT_MAX_LEN}
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-xs">Ширина (мм)</Label>
                <NumericInput
                  value={width}
                  onValueChange={setWidth}
                  min={productType === "sink" ? SK_MIN_W : productType === "stepslab" ? SS_MIN_W : CT_MIN_W}
                  max={productType === "sink" ? SK_MAX_W : productType === "stepslab" ? SS_MAX_W : CT_MAX_W}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {productType === "stepslab" && (
            <div>
              <Label className="text-xs">Толщина бетона (мм)</Label>
              <NumericInput value={thicknessConcrete} onValueChange={setThicknessConcrete} min={SS_MIN_T} max={SS_MAX_T} className={inputClass} />
              {isHeated && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Общая толщина: {thicknessConcrete + SS_SUBSTRATE} мм (бетон {thicknessConcrete} + подложка {SS_SUBSTRATE})
                  {thicknessConcrete + SS_SUBSTRATE > SS_MAX_TOTAL && <span className="text-destructive ml-1">⚠️ макс. {SS_MAX_TOTAL} мм</span>}
                </p>
              )}
            </div>
          )}
          {productType === "countertop" && (
            <div>
              <Label className="text-xs">Толщина (мм)</Label>
              <NumericInput value={thickness} onValueChange={setThickness} min={CT_MIN_T} max={CT_MAX_T} className={inputClass} />
              <p className="text-[10px] text-muted-foreground mt-1">{CT_MIN_T}–{CT_MAX_T} мм</p>
            </div>
          )}
          {productType === "stair" && (
            <div>
              <Label className="text-xs">Толщина (мм)</Label>
              <Select value={String(thickness)} onValueChange={(v) => setThickness(+v)}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 мм</SelectItem>
                  <SelectItem value="35">35 мм</SelectItem>
                  <SelectItem value="40">40 мм (+10%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {productType === "windowsill" && (
            <div>
              <Label className="text-xs">Толщина (мм)</Label>
              <NumericInput value={thickness} onValueChange={setThickness} min={WS_MIN_T} max={WS_MAX_T} className={inputClass} />
              <p className="text-[10px] text-muted-foreground mt-1">{WS_MIN_T}–{WS_MAX_T} мм</p>
            </div>
          )}

          <div>
            <Label className="text-xs">Количество (шт.)</Label>
            <NumericInput value={quantity} onValueChange={setQuantity} min={1} max={productType === "sink" ? 10 : 100} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Countertop drops */}
      {productType === "countertop" && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Опуски (мм)</h3>
          {isRound ? (
            <div className="max-w-[200px]">
              <Label className="text-xs">По периметру</Label>
              <NumericInput value={dropFront} onValueChange={(v) => { setDropFront(v); setDropBack(0); setDropLeft(0); setDropRight(0); }} min={0} max={CT_MAX_DROP} className={inputClass} />
              <p className="text-[10px] text-muted-foreground mt-1">0–{CT_MAX_DROP} мм</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Спереди</Label>
                <NumericInput value={dropFront} onValueChange={setDropFront} min={0} max={CT_MAX_DROP} className={inputClass} />
              </div>
              <div>
                <Label className="text-xs">Сзади</Label>
                <NumericInput value={dropBack} onValueChange={setDropBack} min={0} max={CT_MAX_DROP} className={inputClass} />
              </div>
              <div>
                <Label className="text-xs">Слева</Label>
                <NumericInput value={dropLeft} onValueChange={setDropLeft} min={0} max={CT_MAX_DROP} className={inputClass} />
              </div>
              <div>
                <Label className="text-xs">Справа</Label>
                <NumericInput value={dropRight} onValueChange={setDropRight} min={0} max={CT_MAX_DROP} className={inputClass} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Windowsill drops */}
      {productType === "windowsill" && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Опуски (мм)</h3>
          <p className="text-[10px] text-muted-foreground mb-2">Задняя сторона примыкает к стене — опуск сзади не поддерживается</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Спереди</Label>
              <NumericInput value={dropFront} onValueChange={setDropFront} min={0} max={WS_MAX_DROP} className={inputClass} />
            </div>
            <div>
              <Label className="text-xs">Слева</Label>
              <NumericInput value={dropLeft} onValueChange={setDropLeft} min={0} max={WS_MAX_DROP} className={inputClass} />
            </div>
            <div>
              <Label className="text-xs">Справа</Label>
              <NumericInput value={dropRight} onValueChange={setDropRight} min={0} max={WS_MAX_DROP} className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {/* Countertop supports */}
      {productType === "countertop" && !isRound && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Опоры (мм)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Слева</Label>
              <NumericInput value={supportLeft} onValueChange={setSupportLeft} min={0} max={CT_MAX_SUP} className={inputClass} />
            </div>
            <div>
              <Label className="text-xs">Справа</Label>
              <NumericInput value={supportRight} onValueChange={setSupportRight} min={0} max={CT_MAX_SUP} className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {/* Stair riser */}
      {productType === "stair" && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Подступенок</h3>
          <div className="flex items-center gap-3 mb-3">
            <Switch checked={hasRiser} onCheckedChange={setHasRiser} />
            <Label className="text-sm">С подступенком</Label>
          </div>
          {hasRiser && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Высота подступенка (мм)</Label>
                <NumericInput value={riserHeight} onValueChange={setRiserHeight} min={ST_MIN_RH} max={ST_MAX_RH} className={inputClass} />
                <p className="text-[10px] text-muted-foreground mt-1">{ST_MIN_RH}–{ST_MAX_RH} мм</p>
              </div>
              <div>
                <Label className="text-xs">Толщина подступенка (мм)</Label>
                <NumericInput value={riserThickness} onValueChange={setRiserThickness} min={15} max={20} className={inputClass} />
                <p className="text-[10px] text-muted-foreground mt-1">15–20 мм</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stepslab heated */}
      {productType === "stepslab" && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Дополнительно</h3>
          <div className="flex items-center gap-3">
            <Switch checked={isHeated} onCheckedChange={setIsHeated} />
            <Label className="text-sm">С подогревом</Label>
          </div>
        </div>
      )}

      {/* Sink extras */}
      {productType === "sink" && (
        <>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Чаша</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Количество чаш</Label>
                <NumericInput value={bowlCount} onValueChange={setBowlCount} min={1} max={SK_MAX_BOWLS} className={inputClass} />
              </div>
              <div>
                <Label className="text-xs">Глубина чаши (мм)</Label>
                <NumericInput value={bowlDepth} onValueChange={setBowlDepth} min={50} max={200} className={inputClass} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 mb-3">
              <Switch checked={maxBowlSize} onCheckedChange={setMaxBowlSize} />
              <Label className="text-sm">Максимальная чаша</Label>
            </div>
            {!maxBowlSize && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Длина чаши (мм)</Label>
                  <NumericInput value={bowlLength} onValueChange={setBowlLength} min={200} max={3000} className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs">Ширина чаши (мм)</Label>
                  <NumericInput value={bowlWidth} onValueChange={setBowlWidth} min={200} max={1500} className={inputClass} />
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Слив и смеситель</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Тип слива</Label>
                <Select value={drainType} onValueChange={setDrainType}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="щелевой">Щелевой</SelectItem>
                    <SelectItem value="классический">Классический</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Смеситель</Label>
                <Select value={mixerMount} onValueChange={(v) => setMixerMount(v as "на столешнице" | "на стене")}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="на столешнице">На столешнице</SelectItem>
                    <SelectItem value="на стене">На стене</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Опуски</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Высота опуска (мм)</Label>
                <NumericInput value={overhangHeight} onValueChange={setOverhangHeight} min={0} max={SK_MAX_OH} className={inputClass} />
              </div>
            </div>
            {overhangHeight > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="flex items-center gap-2"><Switch checked={ohFront} onCheckedChange={setOhFront} /><Label className="text-xs">Спереди</Label></div>
                <div className="flex items-center gap-2"><Switch checked={ohBack} onCheckedChange={setOhBack} /><Label className="text-xs">Сзади</Label></div>
                <div className="flex items-center gap-2"><Switch checked={ohLeft} onCheckedChange={setOhLeft} /><Label className="text-xs">Слева</Label></div>
                <div className="flex items-center gap-2"><Switch checked={ohRight} onCheckedChange={setOhRight} /><Label className="text-xs">Справа</Label></div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Color */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Цвет</h3>
        <Select value={color} onValueChange={setColor}>
          <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
          <SelectContent>
            {availableColors.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
            <SelectItem value="другой">Другой (нестандартный)</SelectItem>
          </SelectContent>
        </Select>
        {color === "другой" && (
          <Input
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="Укажите цвет"
            className={`mt-2 ${inputClass}`}
          />
        )}
      </div>
      {/* Transportation box */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Транспортировка</h3>
        <div className="flex items-center gap-3">
          <Switch checked={needsBox} onCheckedChange={setNeedsBox} />
          <Label className="text-sm">Требуется транспортировочный ящик</Label>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-2">
          {validationErrors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{err.message}</span>
            </div>
          ))}
        </div>
      )}

      <Button type="submit" className="w-full gap-2" size="lg">
        <Calculator className="w-5 h-5" />
        Рассчитать стоимость
      </Button>
    </form>
  );
}
