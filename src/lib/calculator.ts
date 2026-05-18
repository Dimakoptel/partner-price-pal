export type ProductType = "countertop" | "sink" | "windowsill" | "backsplash" | "stair" | "stepslab" | "box";

export interface ProductInfo {
  type: ProductType;
  label: string;
  icon: string;
  description: string;
}

export const PRODUCTS: ProductInfo[] = [
  { type: "countertop", label: "Столешница", icon: "🪨", description: "Кухонные столешницы, барные стойки" },
  { type: "sink", label: "Раковина", icon: "🚿", description: "Подвесные и накладные раковины" },
  { type: "windowsill", label: "Подоконник", icon: "🪟", description: "Подоконники из архитектурного бетона" },
  { type: "backsplash", label: "Фартук", icon: "🧱", description: "Кухонные фартуки и панели" },
  { type: "stair", label: "Ступени", icon: "🪜", description: "Лестничные ступени (проступь + подступень)" },
  { type: "stepslab", label: "Пошаговая плита", icon: "🏗️", description: "Ступенчатые и пошаговые плиты" },
  { type: "box", label: "Транспортировочный ящик", icon: "📦", description: "Расчёт материалов и раскрой упаковки" },
];

// Keep as fallback, but dynamic colors from DB take priority
export const STANDARD_COLORS = [
  "белоснежный", "белый", "светло-серый", "серый", "темно-серый",
  "зеленый", "бежевый", "коричневый", "желтый", "терракотовый",
];

export interface CountertopParams {
  length: number;
  width: number;
  diameter?: number;
  isRound: boolean;
  thickness: number;
  color: string;
  quantity: number;
  drops: { front: number; back: number; left: number; right: number };
  supports: { left: number; right: number };
}

export interface SinkParams {
  length: number;
  width: number;
  quantity: number;
  overhangHeight: number;
  overhangSides: { front: boolean; back: boolean; left: boolean; right: boolean };
  bowlCount: number;
  bowlLength?: number;
  bowlWidth?: number;
  bowlDepth?: number;
  maxBowlSize: boolean;
  color: string;
  drainType: string;
  mixerMount: "на столешнице" | "на стене";
}

export interface SimpleProductParams {
  length: number;
  width: number;
  thickness: number;
  color: string;
  quantity: number;
  isHeated?: boolean;
}

export interface StairParams {
  length: number;
  width: number;
  thickness: number; // 30, 35, 40
  color: string;
  quantity: number;
  hasRiser: boolean;
  riserHeight: number; // 100-300, default 180
  riserThickness: number; // 15-20, default 15
}

export interface StairValidationError {
  field: string;
  message: string;
}

export interface StepSlabParams {
  length: number;
  width: number;
  thicknessConcrete: number;
  isHeated: boolean;
  color: string;
  quantity: number;
}

export interface StepSlabValidationError {
  field: string;
  message: string;
}

export interface BacksplashParams {
  width: number;
  height: number;
  thickness: number;
  color: string;
  quantity: number;
}

export interface BacksplashValidationError {
  field: string;
  message: string;
}

export interface CalculationResult {
  productLabel: string;
  area: number;
  /**
   * Площадь обрабатываемых поверхностей одного изделия, м².
   * Учитываются ТОЛЬКО лицевые / видимые поверхности (верх, рёбра, опуски, опоры,
   * внутренние стенки чаши и т.п.). Нижняя/оборотная плоскость не входит.
   * Используется внутри для расчёта сдельной зарплаты (шлифовка, грунтовка, лак).
   */
  surfaceAreaM2?: number;
  weight: number;
  weightPerItem?: number;
  basePrice: number;
  optionPrice: number;
  optionItems: { name: string; price: number }[];
  totalPrice: number;
  supportPrice?: number;
  supportPricePerItem?: number;
  supportLabel?: string;
  installationPrice: number;
  installationNote?: string;
  grandTotal: number;
  quantity: number;
  pricePerUnit: number;
  energyConsumption?: number;
  energyConsumptionPerItem?: number;
  numElements?: number;
  elementWidth?: number;
  liftWarning?: string;
  customThicknessWarning?: string;
  // Stair riser as separate nomenclature
  riserLabel?: string;
  riserPrice?: number;
  riserPricePerUnit?: number;
  riserWeight?: number;
  riserWeightPerItem?: number;
  // Transportation box
  boxLabel?: string;
  boxPrice?: number;
}

export interface CountertopValidationError {
  field: string;
  message: string;
}

export function validateCountertopParams(params: CountertopParams, pricing?: Record<string, number>): CountertopValidationError[] {
  const errors: CountertopValidationError[] = [];
  const p = pricing || {};

  const MIN_LEN = p.countertop_min_length || 500;
  const MAX_LEN = p.countertop_max_length || 3500;
  const MIN_W = p.countertop_min_width || 200;
  const MAX_W = p.countertop_max_width || 1500;
  const MIN_D = p.countertop_min_diameter || 500;
  const MAX_D = p.countertop_max_diameter || 3000;
  const MIN_T = p.countertop_min_thickness || 20;
  const MAX_T = p.countertop_max_thickness || 50;
  const MAX_DROP = p.countertop_max_drop || 300;
  const MIN_SUP = p.countertop_min_support || 750;
  const MAX_SUP = p.countertop_max_support || 1200;

  if (params.isRound) {
    const d = params.diameter || 0;
    if (d < MIN_D) errors.push({ field: "diameter", message: `Минимальный диаметр — ${MIN_D} мм (указано: ${d} мм)` });
    if (d > MAX_D) errors.push({ field: "diameter", message: `Максимальный диаметр — ${MAX_D} мм (указано: ${d} мм)` });
  } else {
    if (params.length < MIN_LEN) errors.push({ field: "length", message: `Минимальная длина — ${MIN_LEN} мм (указано: ${params.length} мм)` });
    if (params.length > MAX_LEN) errors.push({ field: "length", message: `Максимальная длина — ${MAX_LEN} мм (указано: ${params.length} мм)` });
    if (params.width < MIN_W) errors.push({ field: "width", message: `Минимальная ширина — ${MIN_W} мм (указано: ${params.width} мм)` });
    if (params.width > MAX_W) errors.push({ field: "width", message: `Максимальная ширина — ${MAX_W} мм (указано: ${params.width} мм)` });
  }

  if (params.thickness < MIN_T) errors.push({ field: "thickness", message: `Минимальная толщина — ${MIN_T} мм (указано: ${params.thickness} мм)` });
  if (params.thickness > MAX_T) errors.push({ field: "thickness", message: `Максимальная толщина — ${MAX_T} мм (указано: ${params.thickness} мм). Свыше ${MAX_T} мм — требуется согласование.` });

  const hasAnyDrop = Object.values(params.drops).some(h => h > 0);
  const hasAnySupp = Object.values(params.supports).some(h => h > 0);
  if (hasAnyDrop && hasAnySupp) {
    errors.push({ field: "drops_supports", message: "Одновременное использование опор и опусков невозможно" });
  }

  for (const [side, h] of Object.entries(params.drops)) {
    if (h > MAX_DROP) {
      const sideLabel = side === "front" ? "спереди" : side === "back" ? "сзади" : side === "left" ? "слева" : "справа";
      errors.push({ field: `drop_${side}`, message: `Высота опуска ${sideLabel} (${h} мм) не может превышать ${MAX_DROP} мм` });
    }
  }

  for (const [side, h] of Object.entries(params.supports)) {
    if (h > 0 && (h < MIN_SUP || h > MAX_SUP)) {
      const sideLabel = side === "left" ? "слева" : "справа";
      errors.push({ field: `support_${side}`, message: `Высота опоры ${sideLabel} (${h} мм) должна быть ${MIN_SUP}–${MAX_SUP} мм` });
    }
  }

  return errors;
}

export function calculateCountertop(params: CountertopParams, pricing: Record<string, number>, colorNames?: string[]): CalculationResult {
  const BASE_PRICE = pricing.base_price_per_m2 || 53200;
  const DENSITY = pricing.countertop_density || pricing.density || 2350;
  const INSTALL_PER_KG = pricing.countertop_install_per_kg || pricing.install_price_per_kg || 112;
  const MIN_INSTALL = pricing.countertop_min_install || pricing.min_install_price || 10000;
  const THICK_40_MULT = pricing.thickness_40_multiplier || 1.1;
  const IVORY_MULT = pricing.ivory_color_multiplier || 1.03;
  const CUSTOM_COLOR = pricing.countertop_custom_color_surcharge || pricing.custom_color_surcharge || 3000;
  const SUPPORT_MULT = pricing.support_multiplier || 1.15;
  const DROP_MULT = pricing.drop_multiplier || 1.1;

  const stdColors = colorNames || STANDARD_COLORS;
  let area = 0, volume = 0, basePrice = 0, optionPrice = 0;
  const optionItems: { name: string; price: number }[] = [];
  const isIvory = params.color.toLowerCase() === "белоснежный";
  const isCustom = !isIvory && !stdColors.map(c => c.toLowerCase()).includes(params.color.toLowerCase());

  // Area & volume
  if (params.isRound && params.diameter) {
    const r = params.diameter / 2;
    area = (Math.PI * r * r) / 1_000_000;
  } else {
    area = (params.length * params.width) / 1_000_000;
  }
  volume = area * (params.thickness / 1000);

  // Base price with modifiers
  basePrice = area * BASE_PRICE;
  if (params.thickness === 40) basePrice *= THICK_40_MULT;
  if (isIvory) basePrice *= IVORY_MULT;

  // Supports (only non-round)
  if (!params.isRound) {
    for (const side of ["left", "right"] as const) {
      const h = params.supports[side];
      if (h > 0) {
        const sArea = (params.width * h) / 1_000_000;
        const cost = sArea * BASE_PRICE * SUPPORT_MULT;
        optionPrice += cost;
        optionItems.push({ name: `Опора ${side === "left" ? "слева" : "справа"} ${h} мм`, price: Math.round(cost) });
        volume += (params.width * h * params.thickness) / 1_000_000_000;
      }
    }
  }

  // Drops
  if (params.isRound && params.diameter) {
    // Round countertop: only front drop used as "perimeter drop"
    const h = params.drops.front;
    if (h > 0) {
      const len = Math.PI * params.diameter;
      const dArea = (len * h) / 1_000_000;
      const cost = dArea * BASE_PRICE * DROP_MULT;
      optionPrice += cost;
      optionItems.push({ name: `Опуск по периметру ${h} мм`, price: Math.round(cost) });
      volume += (len * h * params.thickness) / 1_000_000_000;
    }
  } else {
    for (const [side, h] of Object.entries(params.drops)) {
      if (h > 0) {
        const len = side === "front" || side === "back" ? params.length : params.width;
        const dArea = (len * h) / 1_000_000;
        const cost = dArea * BASE_PRICE * DROP_MULT;
        optionPrice += cost;
        const sideLabel = side === "front" ? "спереди" : side === "back" ? "сзади" : side === "left" ? "слева" : "справа";
        optionItems.push({ name: `Опуск ${sideLabel} ${h} мм`, price: Math.round(cost) });
        volume += (len * h * params.thickness) / 1_000_000_000;
      }
    }
  }

  // Custom color
  if (isCustom) {
    optionPrice += CUSTOM_COLOR;
    optionItems.push({ name: `Нестандартный цвет: ${params.color}`, price: CUSTOM_COLOR });
  }

  // Quantity & totals
  const qty = Math.max(1, params.quantity);
  const totalBase = basePrice * qty;
  const totalOpt = optionPrice * qty;
  const totalVol = volume * qty;
  const totalWeight = Math.round(totalVol * DENSITY);
  const totalPrice = Math.round(totalBase + totalOpt);
  const installByWeight = Math.round(totalWeight * INSTALL_PER_KG);
  const installationPrice = Math.max(MIN_INSTALL, installByWeight);

  // Build nomenclature label
  let label: string;
  if (params.isRound && params.diameter) {
    label = `Столешница индивидуальная COZY ART Ø${params.diameter} × ${params.thickness} мм`;
  } else {
    label = `Столешница индивидуальная COZY ART ${params.length} × ${params.width} × ${params.thickness} мм`;
  }

  // Add drops to label
  if (params.isRound) {
    if (params.drops.front > 0) {
      label += `, опуск по периметру ${params.drops.front} мм`;
    }
  } else {
    const activeDrops: string[] = [];
    for (const [side, h] of Object.entries(params.drops)) {
      if (h > 0) {
        const sideLabel = side === "front" ? "спереди" : side === "back" ? "сзади" : side === "left" ? "слева" : "справа";
        activeDrops.push(`${sideLabel} ${h}`);
      }
    }
    if (activeDrops.length > 0) label += `, опуски (${activeDrops.join(", ")}) мм`;
  }

  // Add supports to label
  const activeSupports: string[] = [];
  for (const [side, h] of Object.entries(params.supports)) {
    if (h > 0) {
      const sideLabel = side === "left" ? "слева" : "справа";
      activeSupports.push(`${sideLabel} ${h}`);
    }
  }
  if (activeSupports.length > 0) label += `, опоры (${activeSupports.join(", ")}) мм`;

  label += `, архитектурный бетон, цвет ${params.color}`;

  // === Лицевые обрабатываемые поверхности (1 изделие, м²) ===
  // Верх + видимые рёбра по периметру + опуски + наружные грани опор
  let faceM2 = area;
  if (params.isRound && params.diameter) {
    faceM2 += (Math.PI * params.diameter * params.thickness) / 1_000_000;
    if (params.drops.front > 0) {
      faceM2 += (Math.PI * params.diameter * params.drops.front) / 1_000_000;
    }
  } else {
    faceM2 += (2 * (params.length + params.width) * params.thickness) / 1_000_000;
    for (const [side, h] of Object.entries(params.drops)) {
      if (h > 0) {
        const len = side === "front" || side === "back" ? params.length : params.width;
        faceM2 += (len * h) / 1_000_000;
      }
    }
    for (const side of ["left", "right"] as const) {
      const h = params.supports[side];
      if (h > 0) faceM2 += (params.width * h) / 1_000_000;
    }
  }

  return {
    productLabel: label,
    area: +area.toFixed(4),
    surfaceAreaM2: +faceM2.toFixed(4),
    weight: totalWeight,
    basePrice: Math.round(totalBase),
    optionPrice: Math.round(totalOpt),
    optionItems,
    totalPrice,
    installationPrice,
    grandTotal: totalPrice + installationPrice,
    quantity: qty,
    pricePerUnit: Math.round(totalPrice / qty),
  };
}

export interface WindowsillParams {
  length: number;
  width: number;
  thickness: number;
  color: string;
  quantity: number;
  drops: { front: number; left: number; right: number };
}

export interface WindowsillValidationError {
  field: string;
  message: string;
}

export function validateWindowsillParams(params: WindowsillParams, pricing?: Record<string, number>): WindowsillValidationError[] {
  const errors: WindowsillValidationError[] = [];
  const p = pricing || {};
  const MIN_T = p.windowsill_min_thickness || 15;
  const MAX_T = p.windowsill_max_thickness || 50;
  const MAX_DROP = p.windowsill_max_drop || 200;

  if (!params.length || params.length <= 0) errors.push({ field: "length", message: "Не указана длина подоконника" });
  if (!params.width || params.width <= 0) errors.push({ field: "width", message: "Не указана ширина подоконника" });
  if (params.thickness < MIN_T) errors.push({ field: "thickness", message: `Толщина ${params.thickness} мм меньше минимальных ${MIN_T} мм` });
  if (params.thickness > MAX_T) errors.push({ field: "thickness", message: `Толщина ${params.thickness} мм превышает максимальные ${MAX_T} мм` });
  for (const [side, h] of Object.entries(params.drops)) {
    if (h > MAX_DROP) {
      const sideLabel = side === "front" ? "спереди" : side === "left" ? "слева" : "справа";
      errors.push({ field: `drop_${side}`, message: `Высота опуска ${sideLabel} (${h} мм) не может превышать ${MAX_DROP} мм` });
    }
  }
  return errors;
}

export function calculateWindowsill(params: WindowsillParams, pricing: Record<string, number>, colorNames?: string[]): CalculationResult {
  const PRICE_PER_M2 = pricing.windowsill_price_per_m2 || 53200;
  const DENSITY = pricing.windowsill_density || pricing.density || 2350;
  const INSTALL_PER_KG = pricing.windowsill_install_per_kg || pricing.install_price_per_kg || 112;
  const MIN_INSTALL = pricing.windowsill_min_install || pricing.min_install_price || 10000;
  const DROP_MULT = pricing.windowsill_drop_multiplier || 1.15;
  const IVORY_MULT = pricing.windowsill_ivory_multiplier || pricing.ivory_color_multiplier || 1.03;
  const CUSTOM_COLOR = pricing.windowsill_custom_color_surcharge || pricing.custom_color_surcharge || 3000;

  const stdColors = colorNames || STANDARD_COLORS;
  const qty = Math.max(1, Math.floor(params.quantity));
  const thickness = params.thickness || 30;

  // Area & base price
  const areaMain = (params.length * params.width) / 1_000_000;
  let basePrice = areaMain * PRICE_PER_M2;

  // Drops
  const optionItems: { name: string; price: number }[] = [];
  let dropsPrice = 0;

  const dropEntries: [string, number, number][] = [
    ["front", params.drops.front, params.length],
    ["left", params.drops.left, params.width],
    ["right", params.drops.right, params.width],
  ];

  for (const [side, h, len] of dropEntries) {
    if (h > 0) {
      const dropArea = (len * h) / 1_000_000;
      const cost = dropArea * PRICE_PER_M2 * DROP_MULT;
      dropsPrice += cost;
      const sideLabel = side === "front" ? "спереди" : side === "left" ? "слева" : "справа";
      optionItems.push({ name: `Опуск ${sideLabel} ${h} мм`, price: Math.round(cost) });
    }
  }

  let itemPrice = basePrice + dropsPrice;

  // Color modifiers
  const isIvory = params.color.toLowerCase() === "белоснежный";
  const isCustom = !isIvory && !stdColors.map(c => c.toLowerCase()).includes(params.color.toLowerCase());

  if (isIvory) {
    const premium = Math.round(itemPrice * (IVORY_MULT - 1));
    itemPrice += premium;
    optionItems.push({ name: `Наценка «белоснежный» +3%`, price: premium });
  }
  if (isCustom) {
    itemPrice += CUSTOM_COLOR;
    optionItems.push({ name: `Нестандартный цвет: ${params.color}`, price: CUSTOM_COLOR });
  }

  const totalPrice = Math.round(itemPrice * qty);

  // Volume & weight
  const volMain = (params.length * params.width * thickness) / 1_000_000_000;
  let volDrops = 0;
  for (const [, h, len] of dropEntries) {
    if (h > 0) {
      volDrops += (len * thickness * h) / 1_000_000_000;
    }
  }
  const totalVol = (volMain + volDrops) * qty;
  const totalWeight = Math.round(totalVol * DENSITY * 10) / 10;

  // Installation
  const installByWeight = Math.round(totalWeight * INSTALL_PER_KG);
  const installationPrice = Math.max(MIN_INSTALL, installByWeight);

  // Label
  let label = `Подоконник индивидуальный COZY ART ${params.length} × ${params.width} × ${thickness} мм`;
  const activeDrops: string[] = [];
  for (const [side, h] of Object.entries(params.drops)) {
    if (h > 0) {
      const sideLabel = side === "front" ? "спереди" : side === "left" ? "слева" : "справа";
      activeDrops.push(`${sideLabel} ${h}`);
    }
  }
  if (activeDrops.length > 0) label += `, опуски (${activeDrops.join(", ")}) мм`;
  label += `, архитектурный бетон, цвет ${params.color}`;

  const optionPriceTotal = Math.round((dropsPrice + (isIvory ? Math.round((basePrice + dropsPrice) * (IVORY_MULT - 1)) : 0) + (isCustom ? CUSTOM_COLOR : 0)) * qty);

  // Лицевые поверхности: верх + рёбра по периметру*толщина + опуски
  let faceM2 = areaMain + (2 * (params.length + params.width) * thickness) / 1_000_000;
  for (const [, h, len] of dropEntries) {
    if (h > 0) faceM2 += (len * h) / 1_000_000;
  }

  return {
    productLabel: label,
    area: +areaMain.toFixed(4),
    surfaceAreaM2: +faceM2.toFixed(4),
    weight: totalWeight,
    weightPerItem: qty > 1 ? Math.round((volMain + volDrops) * DENSITY * 10) / 10 : undefined,
    basePrice: Math.round(basePrice * qty),
    optionPrice: optionPriceTotal,
    optionItems,
    totalPrice,
    installationPrice,
    grandTotal: totalPrice + installationPrice,
    quantity: qty,
    pricePerUnit: Math.round(itemPrice),
  };
}

export function validateBacksplashParams(params: BacksplashParams, pricing?: Record<string, number>): BacksplashValidationError[] {
  const errors: BacksplashValidationError[] = [];
  const p = pricing || {};
  const MIN_W = p.backsplash_min_width || 100;
  const MAX_W = p.backsplash_max_width || 6000;
  const MIN_H = p.backsplash_min_height || 300;
  const MAX_H = p.backsplash_max_height || 1000;
  const MIN_T = p.backsplash_min_thickness || 10;
  const MAX_T = p.backsplash_max_thickness || 15;

  if (!params.width || params.width < MIN_W) errors.push({ field: "width", message: `Ширина должна быть не менее ${MIN_W} мм (указано: ${params.width} мм)` });
  if (params.width > MAX_W) errors.push({ field: "width", message: `Ширина не может превышать ${MAX_W} мм (указано: ${params.width} мм)` });
  if (params.height < MIN_H) errors.push({ field: "height", message: `Высота должна быть не менее ${MIN_H} мм (указано: ${params.height} мм)` });
  if (params.height > MAX_H) errors.push({ field: "height", message: `Высота не может превышать ${MAX_H} мм (указано: ${params.height} мм)` });
  if (params.thickness < MIN_T) errors.push({ field: "thickness", message: `Толщина фартука не может быть менее ${MIN_T} мм (указано: ${params.thickness} мм)` });
  if (params.thickness > MAX_T) errors.push({ field: "thickness", message: `Толщина фартука не может превышать ${MAX_T} мм (указано: ${params.thickness} мм)` });
  return errors;
}

export function calculateBacksplash(params: BacksplashParams, pricing: Record<string, number>, colorNames?: string[]): CalculationResult {
  const PRICE_PER_M2 = pricing.backsplash_price_per_m2 || 53200;
  const INSTALL_PER_M2 = pricing.backsplash_install_per_m2 || 7000;
  const MIN_INSTALL = pricing.backsplash_min_install || pricing.min_install_price || 10000;
  const IVORY_MULT = pricing.backsplash_ivory_multiplier || pricing.ivory_color_multiplier || 1.03;
  const CUSTOM_COLOR = pricing.backsplash_custom_color_surcharge || pricing.custom_color_surcharge || 3000;
  const MAX_ELEMENT_LENGTH = pricing.backsplash_max_element_length || 3500;
  const LIFT_THRESHOLD = pricing.backsplash_lift_threshold || 2500;
  const STANDARD_THICKNESS = pricing.backsplash_standard_thickness || 15;

  const stdColors = colorNames || STANDARD_COLORS;
  const qty = Math.max(1, Math.floor(params.quantity || 1));
  const thickness = params.thickness || 15;

  // Area
  const area = parseFloat(((params.width * params.height) / 1_000_000).toFixed(3));

  // Transport elements
  const numElements = Math.ceil(params.width / MAX_ELEMENT_LENGTH);
  const elementWidth = Math.ceil(params.width / numElements);

  // Lift warning
  let liftWarning: string | undefined;
  if (elementWidth > LIFT_THRESHOLD) {
    liftWarning = `⚠️ Элемент длиной ${elementWidth} мм может не влезть в лифт. Рекомендуем заказать услуги грузчиков для подъёма на этаж.`;
  }

  // Custom thickness warning
  let customThicknessWarning: string | undefined;
  if (thickness < STANDARD_THICKNESS) {
    customThicknessWarning = `Запрошена толщина ${thickness} мм (менее стандартных 15 мм). Требуется согласование с менеджером.`;
  }

  // Base price
  let totalPrice = Math.round(area * PRICE_PER_M2);

  const optionItems: { name: string; price: number }[] = [];
  let optionPrice = 0;

  // Color modifiers
  const isIvory = params.color.toLowerCase() === "белоснежный";
  const isCustom = !isIvory && !stdColors.map(c => c.toLowerCase()).includes(params.color.toLowerCase());

  if (isIvory) {
    const premium = Math.round(totalPrice * (IVORY_MULT - 1));
    totalPrice = Math.round(totalPrice * IVORY_MULT);
    optionItems.push({ name: `Наценка «белоснежный» +3%`, price: premium });
    optionPrice += premium;
  }
  if (isCustom) {
    totalPrice += CUSTOM_COLOR;
    optionPrice += CUSTOM_COLOR;
    optionItems.push({ name: `Нестандартный цвет: ${params.color}`, price: CUSTOM_COLOR });
  }

  const totalPriceAll = totalPrice * qty;

  // Installation: area-based, not weight-based
  const installationPrice = Math.max(MIN_INSTALL, Math.round(area * INSTALL_PER_M2));

  // Label
  const actualThickness = thickness;
  let label = `Фартук индивидуальный (кухня, ванна) COZY ART ${params.width} × ${params.height} × ${actualThickness} мм`;
  label += `, архитектурный бетон, цвет ${params.color}`;
  if (numElements > 1) {
    label += `, частей ${numElements}`;
  }

  // Transport info in option items
  if (numElements > 1) {
    optionItems.push({ name: `Разбит на ${numElements} элемент(ов) по ~${elementWidth} мм, ${numElements - 1} стык(ов)`, price: 0 });
  }

  // Лицевая поверхность: фронт + видимые рёбра (тонкая панель)
  const faceM2 = area + (2 * (params.width + params.height) * thickness) / 1_000_000;

  return {
    productLabel: label,
    area,
    surfaceAreaM2: +faceM2.toFixed(4),
    weight: 0, // backsplash doesn't calculate weight per spec
    basePrice: Math.round((area * PRICE_PER_M2) * qty),
    optionPrice: Math.round(optionPrice * qty),
    optionItems,
    totalPrice: totalPriceAll,
    installationPrice,
    grandTotal: totalPriceAll + installationPrice,
    quantity: qty,
    pricePerUnit: totalPrice,
    numElements,
    elementWidth,
    liftWarning,
    customThicknessWarning,
  };
}

export function validateStairParams(params: StairParams, pricing?: Record<string, number>): StairValidationError[] {
  const errors: StairValidationError[] = [];
  const p = pricing || {};
  const MIN_T = p.stair_min_thickness || 30;
  const MAX_T = p.stair_max_thickness || 40;
  const MIN_RH = p.stair_min_riser_height || 100;
  const MAX_RH = p.stair_max_riser_height || 300;

  if (!params.length || params.length <= 0) errors.push({ field: "length", message: "Не указана длина ступени" });
  if (!params.width || params.width <= 0) errors.push({ field: "width", message: "Не указана ширина ступени" });
  if (params.thickness < MIN_T) errors.push({ field: "thickness", message: `Толщина ступени ${params.thickness} мм — меньше допустимого (${MIN_T} мм)` });
  if (params.thickness > MAX_T) errors.push({ field: "thickness", message: `Толщина ступени ${params.thickness} мм — больше допустимого (${MAX_T} мм)` });
  if (params.thickness % 5 !== 0) errors.push({ field: "thickness", message: `Толщина ступени ${params.thickness} мм — не кратна 5 мм.` });
  if (params.hasRiser) {
    if (params.riserHeight < MIN_RH) errors.push({ field: "riserHeight", message: `Высота подступенка ${params.riserHeight} мм — меньше минимальных ${MIN_RH} мм` });
    if (params.riserHeight > MAX_RH) errors.push({ field: "riserHeight", message: `Высота подступенка ${params.riserHeight} мм — больше максимальных ${MAX_RH} мм` });
  }
  return errors;
}

export function calculateStair(params: StairParams, pricing: Record<string, number>, colorNames?: string[]): CalculationResult {
  const PRICE_PER_M2 = pricing.stair_price_per_m2 || 53200;
  const DENSITY = pricing.stair_density || 2400;
  const INSTALL_PER_KG = pricing.stair_install_per_kg || pricing.install_price_per_kg || 112;
  const MIN_INSTALL = pricing.stair_min_install || pricing.min_install_price || 10000;
  const CUSTOM_COLOR = pricing.stair_custom_color_surcharge || pricing.custom_color_surcharge || 3000;
  const THICK_40_MULT = pricing.stair_thickness_40_multiplier || pricing.thickness_40_multiplier || 1.1;
  const IVORY_MULT = pricing.stair_ivory_multiplier || pricing.ivory_color_multiplier || 1.03;

  const stdColors = colorNames || STANDARD_COLORS;
  const qty = Math.max(1, Math.floor(params.quantity));
  const thickness = params.thickness || 30;
  const riserThickness = Math.min(20, Math.max(15, params.riserThickness || 15));

  // Area of one tread
  const areaTread = (params.length * params.width) / 1_000_000;

  // Base price per item
  let treadPrice = areaTread * PRICE_PER_M2;
  if (thickness === 40) treadPrice *= THICK_40_MULT;

  const isIvory = params.color.toLowerCase() === "белоснежный";
  const isCustom = !isIvory && !stdColors.map(c => c.toLowerCase()).includes(params.color.toLowerCase());

  if (isIvory) treadPrice *= IVORY_MULT;

  const optionItems: { name: string; price: number }[] = [];
  let optionPrice = 0;

  // Custom color fee per item
  let customColorFeePerItem = 0;
  if (isCustom) {
    customColorFeePerItem = CUSTOM_COLOR;
    optionPrice += CUSTOM_COLOR * qty;
    optionItems.push({ name: `Нестандартный цвет: ${params.color}`, price: CUSTOM_COLOR });
  }

  // Weight of one tread
  const volTread = (params.length * params.width * thickness) / 1_000_000_000;
  const treadWeightPerItem = Math.round(volTread * DENSITY);
  const totalTreadWeight = treadWeightPerItem * qty;

  // Riser (separate nomenclature)
  let riserLabel: string | undefined;
  let riserPrice = 0;
  let riserPricePerUnit = 0;
  let riserWeightPerItem = 0;
  let totalRiserWeight = 0;

  if (params.hasRiser && params.riserHeight > 0) {
    const areaRiser = (params.length * params.riserHeight) / 1_000_000;
    let riserPricePerItem = areaRiser * PRICE_PER_M2;
    if (isIvory) riserPricePerItem *= IVORY_MULT;
    riserPricePerUnit = Math.round(riserPricePerItem);
    riserPrice = riserPricePerUnit * qty;

    const volRiser = (params.length * params.riserHeight * riserThickness) / 1_000_000_000;
    riserWeightPerItem = Math.round(volRiser * DENSITY);
    totalRiserWeight = riserWeightPerItem * qty;

    riserLabel = `Подступенок ${params.length} × ${params.riserHeight} × ${riserThickness} мм`;
  }

  // Total weight (treads + risers)
  const totalWeight = totalTreadWeight + totalRiserWeight;

  // Installation on total weight
  const installByWeight = Math.round(totalWeight * INSTALL_PER_KG);
  const installationPrice = Math.max(MIN_INSTALL, installByWeight);

  // Total prices
  const totalTreadPrice = Math.round(treadPrice * qty);
  const totalPrice = totalTreadPrice + riserPrice + Math.round(optionPrice);

  // Label
  let label = `Ступень индивидуальная COZY ART ${params.length} × ${params.width} × ${thickness} мм`;
  label += `, архитектурный бетон, цвет ${params.color}`;

  // Лицевые поверхности: верх ступени + передний/боковые рёбра + подступенок (фронт)
  let faceM2 = areaTread + (params.length * thickness + 2 * params.width * thickness) / 1_000_000;
  if (params.hasRiser && params.riserHeight > 0) {
    faceM2 += (params.length * params.riserHeight) / 1_000_000;
  }

  return {
    productLabel: label,
    area: +areaTread.toFixed(4),
    surfaceAreaM2: +faceM2.toFixed(4),
    weight: totalWeight,
    weightPerItem: treadWeightPerItem,
    basePrice: totalTreadPrice,
    optionPrice: Math.round(optionPrice),
    optionItems,
    totalPrice,
    installationPrice,
    grandTotal: totalPrice + installationPrice,
    quantity: qty,
    pricePerUnit: Math.round(treadPrice + customColorFeePerItem),
    riserLabel,
    riserPrice,
    riserPricePerUnit,
    riserWeight: totalRiserWeight > 0 ? totalRiserWeight : undefined,
    riserWeightPerItem: riserWeightPerItem > 0 ? riserWeightPerItem : undefined,
  };
}

export function validateStepSlabParams(params: StepSlabParams, pricing?: Record<string, number>): StepSlabValidationError[] {
  const errors: StepSlabValidationError[] = [];
  const p = pricing || {};
  const MIN_L = p.stepslab_min_length || 500;
  const MAX_L = p.stepslab_max_length || 3500;
  const MIN_W = p.stepslab_min_width || 200;
  const MAX_W = p.stepslab_max_width || 1500;
  const MIN_T = p.stepslab_min_thickness || 40;
  const MAX_T = p.stepslab_max_thickness || 60;
  const MAX_TOTAL = p.stepslab_max_total_thickness || 80;
  const SUBSTRATE = p.stepslab_substrate_thickness || 20;

  if (params.length < MIN_L) errors.push({ field: "length", message: `Минимальная длина — ${MIN_L} мм (указано: ${params.length} мм)` });
  if (params.length > MAX_L) errors.push({ field: "length", message: `Максимальная длина — ${MAX_L} мм (указано: ${params.length} мм)` });
  if (params.width < MIN_W) errors.push({ field: "width", message: `Минимальная ширина — ${MIN_W} мм (указано: ${params.width} мм)` });
  if (params.width > MAX_W) errors.push({ field: "width", message: `Максимальная ширина — ${MAX_W} мм (указано: ${params.width} мм)` });
  if (params.thicknessConcrete < MIN_T) errors.push({ field: "thickness", message: `Минимальная толщина бетона — ${MIN_T} мм (указано: ${params.thicknessConcrete} мм)` });
  if (params.thicknessConcrete > MAX_T) errors.push({ field: "thickness", message: `Максимальная толщина бетона — ${MAX_T} мм (указано: ${params.thicknessConcrete} мм)` });
  if (params.isHeated) {
    const total = params.thicknessConcrete + SUBSTRATE;
    if (total > MAX_TOTAL) {
      errors.push({ field: "thickness", message: `Общая толщина с подложкой (${params.thicknessConcrete} + ${SUBSTRATE} = ${total} мм) превышает максимум ${MAX_TOTAL} мм` });
    }
  }
  return errors;
}

export function calculateStepSlab(params: StepSlabParams, pricing: Record<string, number>, colorNames?: string[]): CalculationResult {
  const DENSITY = pricing.stepslab_density || 2400;
  const PRICE_PER_M2_COLD = pricing.stepslab_price_per_m2 || 25300;
  const PRICE_PER_M2_HEATED = pricing.stepslab_heated_price_per_m2 || 33350;
  const CUSTOM_COLOR = pricing.stepslab_custom_color_surcharge || pricing.custom_color_surcharge || 3000;
  const IVORY_MULT = pricing.stepslab_ivory_multiplier || pricing.ivory_color_multiplier || 1.03;
  const WATTS_PER_M2 = pricing.stepslab_watts_per_m2 || 370;
  const SUBSTRATE_THICKNESS = pricing.stepslab_substrate_thickness || 20;

  const stdColors = colorNames || STANDARD_COLORS;
  const area = (params.length * params.width) / 1_000_000;
  // Weight uses only concrete thickness — heating substrate doesn't change weight
  const volumePerItem = (params.length / 1000) * (params.width / 1000) * (params.thicknessConcrete / 1000);
  const qty = Math.max(1, Math.floor(params.quantity));

  const pricePerM2 = params.isHeated ? PRICE_PER_M2_HEATED : PRICE_PER_M2_COLD;
  let basePricePerItem = area * pricePerM2;

  const optionItems: { name: string; price: number }[] = [];
  let optionPrice = 0;

  const isIvory = params.color.toLowerCase() === "белоснежный";
  const isCustom = !isIvory && !stdColors.map(c => c.toLowerCase()).includes(params.color.toLowerCase());
  if (isCustom) {
    optionPrice += CUSTOM_COLOR;
    optionItems.push({ name: `Нестандартный цвет: ${params.color}`, price: CUSTOM_COLOR });
  }
  if (isIvory) {
    basePricePerItem *= IVORY_MULT;
  }

  if (params.isHeated) {
    optionItems.push({ name: "С обогревом", price: 0 });
  }

  const totalPrice = Math.round((basePricePerItem + optionPrice) * qty);
  const weightPerItem = Math.round(volumePerItem * DENSITY);
  const totalWeight = weightPerItem * qty;

  let energyPerItem = 0;
  if (params.isHeated) {
    energyPerItem = Math.round(area * WATTS_PER_M2);
  }

  // Build label
  const thicknessTotal = params.isHeated ? params.thicknessConcrete + SUBSTRATE_THICKNESS : params.thicknessConcrete;
  let label = `Плита пошаговая COZY ART ${params.length} × ${params.width} × ${thicknessTotal} мм`;
  if (params.isHeated) {
    label += ` (бетон ${params.thicknessConcrete} мм + подложка ${SUBSTRATE_THICKNESS} мм)`;
  }
  label += `, ${params.isHeated ? "с обогревом, " : ""}архитектурный фибробетон${params.isHeated ? " с утеплённой подложкой" : ""}, цвет ${params.color}`;

  return {
    productLabel: label,
    area: +area.toFixed(4),
    weight: totalWeight,
    weightPerItem,
    basePrice: Math.round(basePricePerItem * qty),
    optionPrice: Math.round(optionPrice * qty),
    optionItems,
    totalPrice,
    installationPrice: 0,
    installationNote: "Стоимость монтажа уточняется индивидуально у менеджера.\nНа цену влияют: сложность укладки, тип грунта, расстояние на объекте и другие факторы.",
    grandTotal: totalPrice,
    quantity: qty,
    pricePerUnit: Math.round(basePricePerItem + optionPrice),
    energyConsumption: energyPerItem * qty,
    energyConsumptionPerItem: energyPerItem,
  };
}

export interface SinkValidationError {
  field: string;
  message: string;
}

export function validateSinkParams(params: SinkParams, pricing?: Record<string, number>): SinkValidationError[] {
  const errors: SinkValidationError[] = [];
  const p = pricing || {};
  const MIN_L = p.sink_min_length || 500;
  const MAX_L = p.sink_max_length || 4000;
  const MIN_W = p.sink_min_width || 300;
  const MAX_W = p.sink_max_width || 1500;
  const MAX_BOWLS = p.sink_max_bowls || 5;
  const MAX_OH = p.sink_max_overhang || 300;

  if (params.length < MIN_L) errors.push({ field: "length", message: `Минимальная длина раковины — ${MIN_L} мм (указано: ${params.length} мм)` });
  if (params.length > MAX_L) errors.push({ field: "length", message: `Максимальная длина раковины — ${MAX_L} мм (указано: ${params.length} мм). Рекомендуем разделить на 2 изделия.` });
  if (params.width < MIN_W) errors.push({ field: "width", message: `Минимальная ширина раковины — ${MIN_W} мм (указано: ${params.width} мм)` });
  if (params.width > MAX_W) errors.push({ field: "width", message: `Максимальная ширина раковины — ${MAX_W} мм (указано: ${params.width} мм)` });

  if (params.bowlCount < 1) errors.push({ field: "bowlCount", message: "Раковины без чаши не производятся. Минимум 1 чаша." });
  if (params.bowlCount > MAX_BOWLS) errors.push({ field: "bowlCount", message: `Максимум ${MAX_BOWLS} чаш в одной раковине.` });
  if (params.overhangHeight > MAX_OH) errors.push({ field: "overhangHeight", message: `Максимальная высота опуска — ${MAX_OH} мм (указано: ${params.overhangHeight} мм)` });
  if (params.quantity > 10) errors.push({ field: "quantity", message: "Максимум 10 изделий в одном расчёте." });

  return errors;
}

export function calculateSink(params: SinkParams, pricing: Record<string, number>, colorNames?: string[]): CalculationResult {
  const PRICE_PER_SQM = pricing.sink_base_price_per_m2 || pricing.base_price_per_m2 || 53200;
  const DENSITY = pricing.sink_density || pricing.density || 2350;
  const INSTALL_PER_KG = pricing.sink_install_per_kg || pricing.install_price_per_kg || 112;
  const MIN_INSTALL = pricing.sink_min_install || pricing.min_install_price || 12000;
  const CUSTOM_COLOR = pricing.sink_custom_color_surcharge || pricing.custom_color_surcharge || 3000;
  const OVERHANG_MARKUP = pricing.sink_overhang_markup || 0.15;
  const BOWL_MARKUP = pricing.sink_bowl_markup || 1.5;
  const DRAIN_SLOTTED_PER_M = pricing.sink_drain_slotted_per_m || 6000;
  const IVORY_MARKUP = pricing.sink_ivory_multiplier || pricing.ivory_color_multiplier || 1.03;
  const BRACKET_STANDARD_PER_M = pricing.bracket_standard_per_m || 1200;
  const BRACKET_REINFORCED_PER_M = pricing.bracket_reinforced_per_m || 1500;
  const THICKNESS_PLATE = pricing.sink_plate_thickness || 30;
  const THICKNESS_BOWL_WALL = pricing.sink_bowl_wall_thickness || 20;
  const THICKNESS_BOWL_BOTTOM = pricing.sink_bowl_bottom_thickness || 20;
  const EDGE_MARGIN = pricing.sink_edge_margin || 70;
  const MIN_GAP_BETWEEN_BOWLS = pricing.sink_gap_between_bowls || 80;

  const stdColors = colorNames || STANDARD_COLORS;
  const optionItems: { name: string; price: number }[] = [];
  const qty = Math.max(1, params.quantity);

  // --- Bowl dimensions ---
  const mixerOffset = params.mixerMount === "на столешнице" ? 100 : 50;
  const maxBowlWidth = params.width - 35 - mixerOffset;
  const availableLength = params.length - (2 * EDGE_MARGIN) - ((params.bowlCount - 1) * MIN_GAP_BETWEEN_BOWLS);

  let bowlLength: number, bowlWidth: number, bowlDepth: number;

  if (params.maxBowlSize) {
    bowlLength = Math.max(200, Math.floor((availableLength / params.bowlCount) / 10) * 10);
    bowlWidth = Math.max(200, Math.floor(maxBowlWidth / 10) * 10);
    bowlDepth = params.bowlDepth || 100;
  } else if (params.bowlLength && params.bowlWidth) {
    bowlLength = Math.min(params.bowlLength, params.length - 100);
    bowlWidth = Math.min(params.bowlWidth, maxBowlWidth);
    bowlDepth = params.bowlDepth || 100;
  } else {
    // defaults
    bowlLength = params.length < 800 ? Math.max(200, params.length - 100) : 600;
    bowlWidth = Math.max(200, Math.floor(maxBowlWidth / 10) * 10);
    bowlDepth = params.bowlDepth || 100;
  }

  bowlDepth = Math.max(50, Math.min(200, bowlDepth));

  // --- Weight calculation (per item) ---
  const plateVolume = (params.length * params.width * THICKNESS_PLATE) / 1_000_000_000;
  let overhangVolume = 0;
  const oh = params.overhangHeight > 0 ? Math.min(300, Math.max(0, params.overhangHeight)) : 0;
  if (oh > 0) {
    const sides = params.overhangSides;
    if (sides.front) overhangVolume += (params.length * oh * THICKNESS_PLATE) / 1_000_000_000;
    if (sides.back) overhangVolume += (params.length * oh * THICKNESS_PLATE) / 1_000_000_000;
    if (sides.left) overhangVolume += (params.width * oh * THICKNESS_PLATE) / 1_000_000_000;
    if (sides.right) overhangVolume += (params.width * oh * THICKNESS_PLATE) / 1_000_000_000;
  }

  // Bowl material volume (outer - inner)
  const outerBowlVol = (bowlLength * bowlWidth * bowlDepth) / 1_000_000_000;
  const innerL = bowlLength - 2 * THICKNESS_BOWL_WALL;
  const innerW = bowlWidth - 2 * THICKNESS_BOWL_WALL;
  const innerD = bowlDepth - THICKNESS_BOWL_BOTTOM;
  const innerBowlVol = Math.max(0, (innerL * innerW * innerD) / 1_000_000_000);
  const bowlMaterialVol = (outerBowlVol - innerBowlVol) * params.bowlCount;

  const totalVolumePerItem = plateVolume + overhangVolume + bowlMaterialVol;
  const weightPerItem = Math.max(10, Math.round(totalVolumePerItem * DENSITY));

  // --- Price calculation (per item) ---
  // Plate
  const plateArea = (params.length * params.width) / 1_000_000;
  const platePrice = plateArea * PRICE_PER_SQM;

  // Overhangs
  let overhangPrice = 0;
  if (oh > 0) {
    let overhangArea = 0;
    const sides = params.overhangSides;
    if (sides.front) overhangArea += (params.length / 1000) * (oh / 1000);
    if (sides.back) overhangArea += (params.length / 1000) * (oh / 1000);
    if (sides.left) overhangArea += (params.width / 1000) * (oh / 1000);
    if (sides.right) overhangArea += (params.width / 1000) * (oh / 1000);
    overhangPrice = Math.round(overhangArea * PRICE_PER_SQM * (1 + OVERHANG_MARKUP));
    if (overhangPrice > 0) {
      const activeSides = [];
      if (sides.front) activeSides.push("спереди");
      if (sides.back) activeSides.push("сзади");
      if (sides.left) activeSides.push("слева");
      if (sides.right) activeSides.push("справа");
      optionItems.push({ name: `Опуски ${oh} мм (${activeSides.join(", ")})`, price: overhangPrice });
    }
  }

  // Bowls with progressive discount
  const bL = bowlLength / 1000;
  const bW = bowlWidth / 1000;
  const bD = bowlDepth / 1000;
  const bowlSurfaceArea = (bL * bW) + 2 * (bL * bD) + 2 * (bW * bD);
  const baseBowlPrice = bowlSurfaceArea * PRICE_PER_SQM * BOWL_MARKUP;
  let totalBowlsPrice = 0;
  for (let i = 1; i <= params.bowlCount; i++) {
    const discount = i === 1 ? 1.0 : i === 2 ? 0.9 : 0.85;
    totalBowlsPrice += baseBowlPrice * discount;
  }
  const bowlsPrice = Math.round(totalBowlsPrice);
  optionItems.push({ name: `Чаша ${bowlLength}×${bowlWidth}×${bowlDepth} мм x${params.bowlCount}`, price: bowlsPrice });

  // Drain
  let drainPrice = 0;
  if (params.drainType === "щелевой") {
    drainPrice = Math.round((bowlLength / 1000) * DRAIN_SLOTTED_PER_M * params.bowlCount);
    optionItems.push({ name: `Слив щелевой`, price: drainPrice });
  }

  // Color
  let colorMarkup = 0;
  const isIvory = params.color.toLowerCase() === "белоснежный";
  const isCustom = !isIvory && !stdColors.map(c => c.toLowerCase()).includes(params.color.toLowerCase());
  if (isCustom) {
    colorMarkup = CUSTOM_COLOR;
    optionItems.push({ name: `Нестандартный цвет: ${params.color}`, price: CUSTOM_COLOR });
  }

  // Single item price
  let singleItemPrice = platePrice + overhangPrice + bowlsPrice + drainPrice + colorMarkup;
  if (isIvory) {
    singleItemPrice = Math.round(singleItemPrice * IVORY_MARKUP);
    optionItems.push({ name: `Наценка «белоснежный» +3%`, price: Math.round(singleItemPrice - (singleItemPrice / IVORY_MARKUP)) });
  } else {
    singleItemPrice = Math.round(singleItemPrice);
  }

  // Bracket calculation
  let pipeLength_mm = (params.length * 4) + (params.width * 6.5);
  if (params.length >= 1500) pipeLength_mm += params.width * 6.5;
  const pipeLength_m = pipeLength_mm / 1000;
  const pricePerMeter = weightPerItem > 60 ? BRACKET_REINFORCED_PER_M : BRACKET_STANDARD_PER_M;
  const supportPricePerItem = Math.round(pipeLength_m * pricePerMeter);
  const profileType = weightPerItem > 60 ? "усиленный 20×40 мм" : "стандартный 20×20 мм";
  optionItems.push({ name: `Кронштейн ${profileType}`, price: supportPricePerItem });

  // Totals
  const totalPrice = singleItemPrice * qty;
  const totalSupportPrice = supportPricePerItem * qty;
  const totalWeight = weightPerItem * qty;
  const installByWeight = Math.round(totalWeight * INSTALL_PER_KG);
  const installationPrice = Math.max(MIN_INSTALL, installByWeight);

  // Build nomenclature label
  const displayHeight = oh > 0 ? oh : THICKNESS_PLATE;
  let label = `Раковина индивидуальная COZY ART ${params.length} × ${params.width} × ${displayHeight} мм`;
  if (oh > 0) {
    const activeSides: string[] = [];
    if (params.overhangSides.front) activeSides.push("спереди");
    if (params.overhangSides.back) activeSides.push("сзади");
    if (params.overhangSides.left) activeSides.push("слева");
    if (params.overhangSides.right) activeSides.push("справа");
    if (activeSides.length > 0) label += `, опуски (${activeSides.join(", ")})`;
  }
  label += `, чаша ${bowlLength} × ${bowlWidth} × ${bowlDepth} мм`;
  if (params.bowlCount > 1) label += ` ×${params.bowlCount}`;
  label += `, слив ${params.drainType}, архитектурный бетон, цвет ${params.color}`;

  const supportLabel = `Кронштейн стальной ${weightPerItem > 60 ? "усиленный" : "стандартный"} для раковины COZY ART ${params.length} × ${params.width} × ${displayHeight} мм`;

  return {
    productLabel: label,
    area: +plateArea.toFixed(4),
    weight: totalWeight,
    weightPerItem,
    basePrice: Math.round(platePrice * qty),
    optionPrice: Math.round((singleItemPrice - platePrice) * qty + totalSupportPrice),
    optionItems,
    totalPrice: totalPrice + totalSupportPrice,
    supportPrice: totalSupportPrice,
    supportPricePerItem,
    supportLabel,
    installationPrice,
    grandTotal: totalPrice + totalSupportPrice + installationPrice,
    quantity: qty,
    pricePerUnit: singleItemPrice + supportPricePerItem,
  };
}
