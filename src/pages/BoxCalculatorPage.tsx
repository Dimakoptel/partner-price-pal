import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calculateBox,
  MaterialSettings,
  defaultMaterials,
  loadMaterials,
  saveMaterials,
  BoxCalculationResult,
  Sheet,
  Beam,
  BoxDimensions,
} from "@/lib/boxCalculator";
import { Settings, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ===== Item Input =====
function ItemInputPanel({ params, onChange }: {
  params: { length: number; width: number; height: number; boxCount: number };
  onChange: (p: typeof params) => void;
}) {
  const handleChange = (field: string, value: string) => {
    onChange({ ...params, [field]: parseFloat(value) || 0 });
  };
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Параметры изделия</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Длина, мм</Label>
            <Input type="number" value={params.length} onChange={(e) => handleChange("length", e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Ширина, мм</Label>
            <Input type="number" value={params.width} onChange={(e) => handleChange("width", e.target.value)} className="h-9" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Высота, мм</Label>
            <Input type="number" value={params.height} onChange={(e) => handleChange("height", e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Кол-во ящиков</Label>
            <Input type="number" min={1} value={params.boxCount} onChange={(e) => handleChange("boxCount", e.target.value)} className="h-9" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Material Settings =====
function MaterialSettingsPanel({ materials, onUpdate }: { materials: MaterialSettings; onUpdate: (m: MaterialSettings) => void }) {
  const h = (section: "osp" | "foam" | "beam", field: string, value: string) => {
    onUpdate({ ...materials, [section]: { ...materials[section], [field]: parseFloat(value) || 0 } });
  };
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Settings className="w-4 h-4" /> Настройки материалов
      </h3>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="osp" className="border rounded-lg overflow-hidden mb-2">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 text-sm font-medium">⚙️ ОСП-3</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1"><Label className="text-xs">Длина листа, мм</Label><Input type="number" value={materials.osp.length} onChange={(e) => h("osp", "length", e.target.value)} className="h-8" /></div>
              <div className="space-y-1"><Label className="text-xs">Ширина листа, мм</Label><Input type="number" value={materials.osp.width} onChange={(e) => h("osp", "width", e.target.value)} className="h-8" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Толщина, мм</Label><Input type="number" value={materials.osp.thickness} onChange={(e) => h("osp", "thickness", e.target.value)} className="h-8" /></div>
              <div className="space-y-1"><Label className="text-xs">Цена за лист, руб</Label><Input type="number" value={materials.osp.price} onChange={(e) => h("osp", "price", e.target.value)} className="h-8" /></div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="foam" className="border rounded-lg overflow-hidden mb-2">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 text-sm font-medium">⚙️ Пеноплекс</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1"><Label className="text-xs">Длина листа, мм</Label><Input type="number" value={materials.foam.length} onChange={(e) => h("foam", "length", e.target.value)} className="h-8" /></div>
              <div className="space-y-1"><Label className="text-xs">Ширина листа, мм</Label><Input type="number" value={materials.foam.width} onChange={(e) => h("foam", "width", e.target.value)} className="h-8" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Толщина, мм</Label><Input type="number" value={materials.foam.thickness} onChange={(e) => h("foam", "thickness", e.target.value)} className="h-8" /></div>
              <div className="space-y-1"><Label className="text-xs">Цена за лист, руб</Label><Input type="number" value={materials.foam.price} onChange={(e) => h("foam", "price", e.target.value)} className="h-8" /></div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="beam" className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 text-sm font-medium">⚙️ Брусок</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1"><Label className="text-xs">Сечение (ш), мм</Label><Input type="number" value={materials.beam.width} onChange={(e) => h("beam", "width", e.target.value)} className="h-8" /></div>
              <div className="space-y-1"><Label className="text-xs">Сечение (в), мм</Label><Input type="number" value={materials.beam.height} onChange={(e) => h("beam", "height", e.target.value)} className="h-8" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Длина заготовки, мм</Label><Input type="number" value={materials.beam.standardLength} onChange={(e) => h("beam", "standardLength", e.target.value)} className="h-8" /></div>
              <div className="space-y-1"><Label className="text-xs">Цена за шт., руб</Label><Input type="number" value={materials.beam.price} onChange={(e) => h("beam", "price", e.target.value)} className="h-8" /></div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// ===== Specification Table =====
function SpecificationTable({ dimensions }: { dimensions: BoxDimensions }) {
  const specs = [
    { id: 1, name: "Прокладка (длина)", material: `Пеноплекс ${dimensions.foamThick}мм`, length: dimensions.foamLongSideL, width: dimensions.foamLongSideH, perBox: 2, total: 2 * dimensions.boxCount, type: "foam" },
    { id: 2, name: "Прокладка (ширина)", material: `Пеноплекс ${dimensions.foamThick}мм`, length: dimensions.foamShortSideW, width: dimensions.foamShortSideH, perBox: 2, total: 2 * dimensions.boxCount, type: "foam" },
    { id: 3, name: "Вкладыш дно/крышка", material: `Пеноплекс ${dimensions.foamThick}мм`, length: dimensions.foamBottomL, width: dimensions.foamBottomW, perBox: 2, total: 2 * dimensions.boxCount, type: "foam" },
    { id: 4, name: "Стенка L (боковина)", material: `ОСП-${dimensions.ospThick}мм`, length: dimensions.ospLongSideL, width: dimensions.ospLongSideH, perBox: 2, total: 2 * dimensions.boxCount, type: "osp" },
    { id: 5, name: "Стенка W (боковина)", material: `ОСП-${dimensions.ospThick}мм`, length: dimensions.ospShortSideW, width: dimensions.ospShortSideH, perBox: 2, total: 2 * dimensions.boxCount, type: "osp" },
    { id: 6, name: "Дно/Крышка", material: `ОСП-${dimensions.ospThick}мм`, length: dimensions.ospBottomL, width: dimensions.ospBottomW, perBox: 2, total: 2 * dimensions.boxCount, type: "osp" },
    { id: 7, name: "Планка длинная", material: `Брусок ${dimensions.beamW}×${dimensions.beamH}`, length: dimensions.beamLong, width: dimensions.beamW, perBox: 4, total: 4 * dimensions.boxCount, type: "beam" },
    { id: 8, name: "Планка короткая", material: `Брусок ${dimensions.beamW}×${dimensions.beamH}`, length: dimensions.beamShort, width: dimensions.beamW, perBox: 4, total: 4 * dimensions.boxCount, type: "beam" },
    { id: 9, name: "Угловая вставка", material: `Брусок ${dimensions.beamW}×${dimensions.beamH}`, length: dimensions.beamCorner, width: dimensions.beamW, perBox: 4, total: 4 * dimensions.boxCount, type: "beam" },
  ];
  const rowClass = (t: string) => t === "foam" ? "bg-orange-500/10" : t === "osp" ? "bg-blue-500/10" : "bg-purple-500/10";
  return (
    <div className="rounded-lg border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary">
            <TableHead className="text-primary-foreground font-semibold">№</TableHead>
            <TableHead className="text-primary-foreground font-semibold">Наименование</TableHead>
            <TableHead className="text-primary-foreground font-semibold">Материал</TableHead>
            <TableHead className="text-primary-foreground font-semibold text-right">Длина</TableHead>
            <TableHead className="text-primary-foreground font-semibold text-right">Ширина</TableHead>
            <TableHead className="text-primary-foreground font-semibold text-right">На 1 ящик</TableHead>
            <TableHead className="text-primary-foreground font-semibold text-right">Всего</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {specs.map((s) => (
            <TableRow key={s.id} className={rowClass(s.type)}>
              <TableCell className="font-medium">{s.id}</TableCell>
              <TableCell>{s.name}</TableCell>
              <TableCell>{s.material}</TableCell>
              <TableCell className="text-right font-mono">{s.length.toFixed(1)}</TableCell>
              <TableCell className="text-right font-mono">{s.width.toFixed(1)}</TableCell>
              <TableCell className="text-right">{s.perBox}</TableCell>
              <TableCell className="text-right font-semibold">{s.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ===== Sheet Cutting Map =====
function SheetCuttingMap({ sheets, sheetWidth, sheetHeight, title, materialType, thickness }: {
  sheets: Sheet[]; sheetWidth: number; sheetHeight: number; title: string; materialType: "osp" | "foam"; thickness: number;
}) {
  const maxDisplayWidth = 700;
  const scale = Math.min(maxDisplayWidth / sheetWidth, 300 / sheetHeight);
  const partBg = materialType === "osp" ? "bg-blue-400 border-blue-600" : "bg-orange-400 border-orange-600";

  return (
    <div className="space-y-4">
      {sheets.map((sheet, si) => {
        const usedArea = sheet.parts.reduce((s, p) => s + p.w * p.h, 0);
        const eff = ((usedArea / (sheetWidth * sheetHeight)) * 100).toFixed(1);
        return (
          <div key={si} className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
              <div className="font-semibold text-sm">{title} {thickness}мм — Лист {si + 1}/{sheets.length}</div>
              <div className="text-sm text-muted-foreground">Выход: {eff}% | Деталей: {sheet.parts.length}</div>
            </div>
            <div className="p-4 flex justify-center overflow-x-auto">
              <div className="relative bg-muted/30 border-2 border-foreground/30" style={{ width: sheetWidth * scale, height: sheetHeight * scale }}>
                {sheet.parts.map((part, pi) => {
                  const dW = Math.max(part.w * scale, 30);
                  const dH = Math.max(part.h * scale, 20);
                  return (
                    <div key={pi} className={cn("absolute border-2 flex flex-col items-center justify-center text-xs font-bold shadow-sm overflow-hidden", partBg)}
                      style={{ left: part.x * scale, top: part.y * scale, width: dW - 2, height: dH - 2 }}
                      title={`${part.name}: ${part.originalW.toFixed(0)}×${part.originalH.toFixed(0)}${part.rotated ? " (90°)" : ""}`}
                    >
                      {dW > 50 && dH > 28 && <span className="text-[10px]">{part.originalW.toFixed(0)}×{part.originalH.toFixed(0)}</span>}
                      {part.rotated && dW > 35 && dH > 20 && <span className="text-[9px] opacity-80">90°</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===== Beam Cutting Map =====
function BeamCuttingMap({ beams, beamWidth, beamHeight, standardLength }: {
  beams: Beam[]; beamWidth: number; beamHeight: number; standardLength: number;
}) {
  const scale = 0.18;
  const kerf = 3;
  const visualHeight = 50;
  return (
    <div className="space-y-3">
      {beams.map((beam, bi) => {
        const widthPx = standardLength * scale;
        let currentX = 0;
        return (
          <div key={bi} className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b">
              <div className="font-semibold text-sm">Брусок {beamWidth}×{beamHeight}мм — №{bi + 1}</div>
              <div className="text-sm text-muted-foreground">Остаток: {Math.round(beam.remaining)}мм</div>
            </div>
            <div className="p-4 overflow-x-auto">
              <div className="relative bg-muted border-2 border-foreground/30 rounded" style={{ width: widthPx, height: visualHeight }}>
                {beam.parts.map((part, pi) => {
                  const pw = part.length * scale;
                  const px = currentX;
                  currentX += (part.length + kerf) * scale;
                  return (
                    <div key={pi}>
                      <div className="absolute top-2 bg-gradient-to-b from-purple-300 to-purple-400 border-r-2 border-purple-700 flex items-center justify-center text-xs font-bold text-purple-900"
                        style={{ left: px, width: pw, height: visualHeight - 16 }} title={`${part.name}: ${part.length}мм`}
                      >{pw > 40 && part.length.toFixed(0)}</div>
                      {pi < beam.parts.length - 1 && (
                        <div className="absolute top-3 w-0.5 bg-foreground/60" style={{ left: px + pw, height: visualHeight - 24 }} />
                      )}
                    </div>
                  );
                })}
                {beam.remaining > 50 && (
                  <div className="absolute top-2 flex items-center justify-center text-xs text-orange-800 font-medium"
                    style={{ left: currentX, width: beam.remaining * scale, height: visualHeight - 16, background: "repeating-linear-gradient(45deg, hsl(var(--accent)/0.3), hsl(var(--accent)/0.3) 8px, hsl(var(--accent)/0.5) 8px, hsl(var(--accent)/0.5) 16px)", borderLeft: "1px dashed hsl(var(--accent))" }}>
                    {Math.round(beam.remaining)}мм
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===== Cost Summary =====
function CostSummary({ result }: { result: BoxCalculationResult }) {
  const { dimensions, ospSheets, foamSheets, beamCutting, materials, costs } = result;
  const workCost = costs.total * 0.6;
  const grandTotal = costs.total + workCost;

  const ospStats: Record<string, number> = {};
  ospSheets.forEach((s) => s.parts.forEach((p) => { const k = `${p.originalW.toFixed(0)}×${p.originalH.toFixed(0)}`; ospStats[k] = (ospStats[k] || 0) + 1; }));
  const foamStats: Record<string, number> = {};
  foamSheets.forEach((s) => s.parts.forEach((p) => { const k = `${p.originalW.toFixed(0)}×${p.originalH.toFixed(0)}`; foamStats[k] = (foamStats[k] || 0) + 1; }));
  const beamStats: Record<string, { count: number; name: string }> = {};
  beamCutting.forEach((b) => b.parts.forEach((p) => { const k = p.length.toFixed(0); if (!beamStats[k]) beamStats[k] = { count: 0, name: p.name }; beamStats[k].count++; }));

  let rowIdx = 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Смета материалов</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b"><span>ОСП-3:</span><span className="font-medium">{ospSheets.length} листов ({costs.osp.toFixed(0)} руб)</span></div>
          <div className="flex justify-between py-2 border-b"><span>Пеноплекс:</span><span className="font-medium">{foamSheets.length} листов ({costs.foam.toFixed(0)} руб)</span></div>
          <div className="flex justify-between py-2 border-b"><span>Брусок:</span><span className="font-medium">{beamCutting.length} шт ({costs.beam.toFixed(0)} руб)</span></div>
          <div className="flex justify-between py-3 mt-2 border-t-2 border-foreground text-lg font-bold"><span>Материалы:</span><span>{costs.total.toFixed(0)} руб</span></div>
          <div className="flex justify-between py-2 border-b"><span>Работа (60%):</span><span className="font-medium">{workCost.toFixed(0)} руб</span></div>
          <div className="flex justify-between py-3 mt-2 border-t-2 border-primary text-lg font-bold text-primary"><span>ИТОГО:</span><span>{grandTotal.toFixed(0)} руб</span></div>
          {dimensions.boxCount > 1 && (
            <div className="text-sm text-muted-foreground text-right">За 1 ящик: {(grandTotal / dimensions.boxCount).toFixed(0)} руб</div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary">
              <TableHead className="text-primary-foreground font-semibold">№</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Материал</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Размер детали</TableHead>
              <TableHead className="text-primary-foreground font-semibold text-right">Кол-во</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Примечание</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-blue-500/10"><TableCell colSpan={5} className="font-semibold">ОСП-{dimensions.ospThick}мм | Лист {materials.osp.length}×{materials.osp.width}мм | {ospSheets.length} шт.</TableCell></TableRow>
            {Object.entries(ospStats).map(([size, count]) => (
              <TableRow key={`osp-${size}`}><TableCell>{rowIdx++}</TableCell><TableCell>ОСП-{dimensions.ospThick}мм</TableCell><TableCell className="font-mono">{size} мм</TableCell><TableCell className="text-right">{count} шт.</TableCell><TableCell className="text-muted-foreground">Распил</TableCell></TableRow>
            ))}
            <TableRow className="bg-orange-500/10"><TableCell colSpan={5} className="font-semibold">Пеноплекс {dimensions.foamThick}мм | Лист {materials.foam.length}×{materials.foam.width}мм | {foamSheets.length} шт.</TableCell></TableRow>
            {Object.entries(foamStats).map(([size, count]) => (
              <TableRow key={`foam-${size}`}><TableCell>{rowIdx++}</TableCell><TableCell>Пеноплекс</TableCell><TableCell className="font-mono">{size} мм</TableCell><TableCell className="text-right">{count} шт.</TableCell><TableCell className="text-muted-foreground">Чистовой распил</TableCell></TableRow>
            ))}
            <TableRow className="bg-purple-500/10"><TableCell colSpan={5} className="font-semibold">Брусок {dimensions.beamW}×{dimensions.beamH}мм | {beamCutting.length} шт.</TableCell></TableRow>
            {Object.entries(beamStats).map(([length, data]) => (
              <TableRow key={`beam-${length}`}><TableCell>{rowIdx++}</TableCell><TableCell>Брусок</TableCell><TableCell className="font-mono">{length} мм</TableCell><TableCell className="text-right">{data.count} шт.</TableCell><TableCell className="text-muted-foreground">{data.name}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ===== MAIN PAGE =====

export default function BoxCalculatorPage() {
  const [itemParams, setItemParams] = useState({ length: 600, width: 400, height: 110, boxCount: 1 });
  const [materials, setMaterials] = useState<MaterialSettings>(defaultMaterials);
  const [activeTab, setActiveTab] = useState("spec");

  useEffect(() => {
    setMaterials(loadMaterials());
  }, []);

  const updateMaterials = useCallback((m: MaterialSettings) => {
    setMaterials(m);
    saveMaterials(m);
  }, []);

  const result = useMemo(() =>
    calculateBox(itemParams.length, itemParams.width, itemParams.height, itemParams.boxCount, materials),
    [itemParams, materials]
  );

  const handlePrint = () => {
    setActiveTab("cost");
    setTimeout(() => window.print(), 300);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold mb-1">Калькулятор транспортировочного ящика</h1>
          <p className="text-muted-foreground text-sm mb-6">Расчёт материалов и раскрой для упаковки изделий</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-80 shrink-0 space-y-6 print:hidden">
            <ItemInputPanel params={itemParams} onChange={setItemParams} />
            <MaterialSettingsPanel materials={materials} onUpdate={updateMaterials} />
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                <TabsTrigger value="spec" className="text-xs uppercase tracking-wider">Спецификация</TabsTrigger>
                <TabsTrigger value="cutting" className="text-xs uppercase tracking-wider">Карта раскроя</TabsTrigger>
                <TabsTrigger value="cost" className="text-xs uppercase tracking-wider">Смета</TabsTrigger>
              </TabsList>

              <TabsContent value="spec">
                <h2 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-primary inline-block">Спецификация деталей</h2>
                <SpecificationTable dimensions={result.dimensions} />
              </TabsContent>

              <TabsContent value="cutting" className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-primary inline-block">Раскрой ОСП</h2>
                  <SheetCuttingMap sheets={result.ospSheets} sheetWidth={materials.osp.length} sheetHeight={materials.osp.width} title="ОСП" materialType="osp" thickness={materials.osp.thickness} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-primary inline-block">Раскрой Пеноплекс</h2>
                  <SheetCuttingMap sheets={result.foamSheets} sheetWidth={materials.foam.length} sheetHeight={materials.foam.width} title="Пеноплекс" materialType="foam" thickness={materials.foam.thickness} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-4 pb-2 border-b-2 border-primary inline-block">Раскрой брусков</h2>
                  <BeamCuttingMap beams={result.beamCutting} beamWidth={materials.beam.width} beamHeight={materials.beam.height} standardLength={materials.beam.standardLength} />
                </div>
              </TabsContent>

              <TabsContent value="cost">
                <CostSummary result={result} />
              </TabsContent>
            </Tabs>

            {/* Print view */}
            <div className="hidden print:block">
              <h1 className="text-xl font-bold mb-2">ЗАДАНИЕ НА РАСПИЛ</h1>
              <p className="text-sm text-muted-foreground mb-6">Транспортировочный ящик | COZY ART</p>
              <CostSummary result={result} />
            </div>
          </div>
        </div>

        <Button onClick={handlePrint} className="fixed bottom-8 right-8 rounded-full shadow-xl print:hidden" size="lg">
          <Printer className="w-5 h-5 mr-2" /> Печать
        </Button>
      </div>
    </AppLayout>
  );
}
