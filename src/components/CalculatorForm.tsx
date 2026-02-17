import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CountertopParams, SinkParams, SimpleProductParams, ProductType, validateSinkParams, SinkValidationError, validateCountertopParams, CountertopValidationError } from "@/lib/calculator";
import { Calculator, AlertTriangle } from "lucide-react";

interface Props {
  productType: ProductType;
  onCalculate: (params: any) => void;
  colorNames?: string[];
}

export default function CalculatorForm({ productType, onCalculate, colorNames = [] }: Props) {
  const [length, setLength] = useState(1000);
  const [width, setWidth] = useState(600);
  const [diameter, setDiameter] = useState(800);
  const [isRound, setIsRound] = useState(false);
  const [thickness, setThickness] = useState(30);
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
  const [riserHeight, setRiserHeight] = useState(150);
  const [isHeated, setIsHeated] = useState(false);
  const [validationErrors, setValidationErrors] = useState<(SinkValidationError | CountertopValidationError)[]>([]);
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
      const errors = validateCountertopParams(params);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      onCalculate(params);
    } else if (productType === "sink") {
      const params: SinkParams = {
        length, width, quantity, overhangHeight,
        overhangSides: { front: ohFront, back: ohBack, left: ohLeft, right: ohRight },
        bowlCount,
        bowlLength: maxBowlSize ? undefined : bowlLength,
        bowlWidth: maxBowlSize ? undefined : bowlWidth,
        bowlDepth,
        maxBowlSize,
        color: finalColor, drainType, mixerMount,
      };
      const errors = validateSinkParams(params);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      onCalculate(params);
    } else {
      const params: SimpleProductParams = {
        length, width, thickness, color: finalColor, quantity,
        hasRiser: productType === "stair" ? hasRiser : undefined,
        riserHeight: productType === "stair" && hasRiser ? riserHeight : undefined,
        isHeated: productType === "stepslab" ? isHeated : undefined,
      };
      onCalculate(params);
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
          {productType === "countertop" && isRound ? (
            <div>
              <Label className="text-xs">Диаметр (мм)</Label>
              <Input type="number" value={diameter} onChange={(e) => setDiameter(+e.target.value)} min={500} max={3000} className={inputClass} />
            </div>
          ) : (
            <>
              <div>
                <Label className="text-xs">Длина (мм)</Label>
                <Input type="number" value={length} onChange={(e) => setLength(+e.target.value)} min={productType === "sink" ? 500 : 500} max={productType === "sink" ? 4000 : 3500} className={inputClass} />
              </div>
              <div>
                <Label className="text-xs">Ширина (мм)</Label>
                <Input type="number" value={width} onChange={(e) => setWidth(+e.target.value)} min={productType === "sink" ? 300 : 200} max={productType === "sink" ? 1500 : 1500} className={inputClass} />
              </div>
            </>
          )}

          {(productType === "countertop" || productType === "windowsill" || productType === "backsplash" || productType === "stair" || productType === "stepslab") && (
            <div>
              <Label className="text-xs">Толщина (мм)</Label>
              <Input type="number" value={thickness} onChange={(e) => setThickness(+e.target.value)} min={20} max={50} className={inputClass} />
            </div>
          )}

          <div>
            <Label className="text-xs">Количество (шт.)</Label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(+e.target.value)} min={1} max={productType === "sink" ? 10 : 100} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Countertop drops - now for both round and rectangular */}
      {productType === "countertop" && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Опуски (мм)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Спереди</Label>
              <Input type="number" value={dropFront} onChange={(e) => setDropFront(+e.target.value)} min={0} max={300} className={inputClass} />
            </div>
            <div>
              <Label className="text-xs">Сзади</Label>
              <Input type="number" value={dropBack} onChange={(e) => setDropBack(+e.target.value)} min={0} max={300} className={inputClass} />
            </div>
            <div>
              <Label className="text-xs">Слева</Label>
              <Input type="number" value={dropLeft} onChange={(e) => setDropLeft(+e.target.value)} min={0} max={300} className={inputClass} />
            </div>
            <div>
              <Label className="text-xs">Справа</Label>
              <Input type="number" value={dropRight} onChange={(e) => setDropRight(+e.target.value)} min={0} max={300} className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {/* Countertop supports - only for non-round */}
      {productType === "countertop" && !isRound && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Опоры (мм)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Слева</Label>
              <Input type="number" value={supportLeft} onChange={(e) => setSupportLeft(+e.target.value)} min={0} max={1200} className={inputClass} />
            </div>
            <div>
              <Label className="text-xs">Справа</Label>
              <Input type="number" value={supportRight} onChange={(e) => setSupportRight(+e.target.value)} min={0} max={1200} className={inputClass} />
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
                <Input type="number" value={riserHeight} onChange={(e) => setRiserHeight(+e.target.value)} min={50} max={300} className={inputClass} />
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
                <Input type="number" value={bowlCount} onChange={(e) => setBowlCount(+e.target.value)} min={1} max={5} className={inputClass} />
              </div>
              <div>
                <Label className="text-xs">Глубина чаши (мм)</Label>
                <Input type="number" value={bowlDepth} onChange={(e) => setBowlDepth(+e.target.value)} min={50} max={200} className={inputClass} />
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
                  <Input type="number" value={bowlLength} onChange={(e) => setBowlLength(+e.target.value)} min={200} max={3000} className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs">Ширина чаши (мм)</Label>
                  <Input type="number" value={bowlWidth} onChange={(e) => setBowlWidth(+e.target.value)} min={200} max={1500} className={inputClass} />
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
                <Input type="number" value={overhangHeight} onChange={(e) => setOverhangHeight(+e.target.value)} min={0} max={300} className={inputClass} />
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
