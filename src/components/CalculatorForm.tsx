import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { STANDARD_COLORS, CountertopParams, SinkParams, SimpleProductParams, ProductType } from "@/lib/calculator";
import { Calculator } from "lucide-react";

interface Props {
  productType: ProductType;
  onCalculate: (params: any) => void;
}

export default function CalculatorForm({ productType, onCalculate }: Props) {
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
  const [overhangHeight, setOverhangHeight] = useState(0);
  const [ohFront, setOhFront] = useState(true);
  const [ohBack, setOhBack] = useState(false);
  const [ohLeft, setOhLeft] = useState(false);
  const [ohRight, setOhRight] = useState(false);
  const [drainType, setDrainType] = useState("щелевой");

  const finalColor = color === "другой" ? customColor : color;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (productType === "countertop") {
      const params: CountertopParams = {
        length, width, diameter, isRound, thickness, color: finalColor, quantity,
        drops: { front: dropFront, back: dropBack, left: dropLeft, right: dropRight },
        supports: { left: supportLeft, right: supportRight },
      };
      onCalculate(params);
    } else if (productType === "sink") {
      const params: SinkParams = {
        length, width, quantity, overhangHeight,
        overhangSides: { front: ohFront, back: ohBack, left: ohLeft, right: ohRight },
        bowlCount, color: finalColor, drainType,
      };
      onCalculate(params);
    } else {
      const params: SimpleProductParams = {
        length, width, thickness, color: finalColor, quantity,
      };
      onCalculate(params);
    }
  };

  const inputClass = "bg-secondary border-border";

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
                <Input type="number" value={length} onChange={(e) => setLength(+e.target.value)} min={200} max={5000} className={inputClass} />
              </div>
              <div>
                <Label className="text-xs">Ширина (мм)</Label>
                <Input type="number" value={width} onChange={(e) => setWidth(+e.target.value)} min={200} max={2000} className={inputClass} />
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
            <Input type="number" value={quantity} onChange={(e) => setQuantity(+e.target.value)} min={1} max={100} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Countertop extras */}
      {productType === "countertop" && !isRound && (
        <>
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
        </>
      )}

      {/* Sink extras */}
      {productType === "sink" && (
        <>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Чаша</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Количество чаш</Label>
                <Input type="number" value={bowlCount} onChange={(e) => setBowlCount(+e.target.value)} min={1} max={3} className={inputClass} />
              </div>
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
            {STANDARD_COLORS.map((c) => (
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

      <Button type="submit" className="w-full gap-2" size="lg">
        <Calculator className="w-5 h-5" />
        Рассчитать стоимость
      </Button>
    </form>
  );
}
