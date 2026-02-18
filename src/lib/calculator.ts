export type ProductType = "countertop" | "sink" | "windowsill" | "backsplash" | "stair" | "stepslab";

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
  hasRiser?: boolean;
  riserHeight?: number;
  isHeated?: boolean;
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

export interface CalculationResult {
  productLabel: string;
  area: number;
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
}

export interface CountertopValidationError {
  field: string;
  message: string;
}

export function validateCountertopParams(params: CountertopParams): CountertopValidationError[] {
  const errors: CountertopValidationError[] = [];

  // Size validation
  if (params.isRound) {
    const d = params.diameter || 0;
    if (d < 500) errors.push({ field: "diameter", message: `Минимальный диаметр — 500 мм (указано: ${d} мм)` });
    if (d > 3000) errors.push({ field: "diameter", message: `Максимальный диаметр — 3000 мм (указано: ${d} мм)` });
  } else {
    if (params.length < 500) errors.push({ field: "length", message: `Минимальная длина — 500 мм (указано: ${params.length} мм)` });
    if (params.length > 3500) errors.push({ field: "length", message: `Максимальная длина — 3500 мм (указано: ${params.length} мм)` });
    if (params.width < 200) errors.push({ field: "width", message: `Минимальная ширина — 200 мм (указано: ${params.width} мм)` });
    if (params.width > 1500) errors.push({ field: "width", message: `Максимальная ширина — 1500 мм (указано: ${params.width} мм)` });
  }

  // Thickness
  if (params.thickness < 20) errors.push({ field: "thickness", message: `Минимальная толщина — 20 мм (указано: ${params.thickness} мм)` });
  if (params.thickness > 50) errors.push({ field: "thickness", message: `Максимальная толщина — 50 мм (указано: ${params.thickness} мм). Свыше 50 мм — требуется согласование.` });

  // Conflict: drops + supports
  const hasAnyDrop = Object.values(params.drops).some(h => h > 0);
  const hasAnySupp = Object.values(params.supports).some(h => h > 0);
  if (hasAnyDrop && hasAnySupp) {
    errors.push({ field: "drops_supports", message: "Одновременное использование опор и опусков невозможно" });
  }

  // Drop height limits
  for (const [side, h] of Object.entries(params.drops)) {
    if (h > 300) {
      const sideLabel = side === "front" ? "спереди" : side === "back" ? "сзади" : side === "left" ? "слева" : "справа";
      errors.push({ field: `drop_${side}`, message: `Высота опуска ${sideLabel} (${h} мм) не может превышать 300 мм` });
    }
  }

  // Support height limits (750–1200)
  for (const [side, h] of Object.entries(params.supports)) {
    if (h > 0 && (h < 750 || h > 1200)) {
      const sideLabel = side === "left" ? "слева" : "справа";
      errors.push({ field: `support_${side}`, message: `Высота опоры ${sideLabel} (${h} мм) должна быть 750–1200 мм` });
    }
  }

  return errors;
}

export function calculateCountertop(params: CountertopParams, pricing: Record<string, number>, colorNames?: string[]): CalculationResult {
  const BASE_PRICE = pricing.base_price_per_m2 || 53200;
  const DENSITY = pricing.density || 2350;
  const INSTALL_PER_KG = pricing.install_price_per_kg || 112;
  const MIN_INSTALL = pricing.min_install_price || 10000;
  const THICK_40_MULT = pricing.thickness_40_multiplier || 1.1;
  const IVORY_MULT = pricing.ivory_color_multiplier || 1.03;
  const CUSTOM_COLOR = pricing.custom_color_surcharge || 3000;
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
  for (const [side, h] of Object.entries(params.drops)) {
    if (h > 0) {
      let len: number;
      if (params.isRound && params.diameter) {
        len = Math.PI * params.diameter;
      } else {
        len = side === "front" || side === "back" ? params.length : params.width;
      }
      const dArea = (len * h) / 1_000_000;
      const cost = dArea * BASE_PRICE * DROP_MULT;
      optionPrice += cost;
      const sideLabel = side === "front" ? "спереди" : side === "back" ? "сзади" : side === "left" ? "слева" : "справа";
      optionItems.push({ name: `Опуск ${sideLabel} ${h} мм`, price: Math.round(cost) });
      volume += (len * h * params.thickness) / 1_000_000_000;
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
  const activeDrops: string[] = [];
  for (const [side, h] of Object.entries(params.drops)) {
    if (h > 0) {
      const sideLabel = side === "front" ? "спереди" : side === "back" ? "сзади" : side === "left" ? "слева" : "справа";
      activeDrops.push(`${sideLabel} ${h}`);
    }
  }
  if (activeDrops.length > 0) label += `, опуски (${activeDrops.join(", ")}) мм`;

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

  return {
    productLabel: label,
    area: +area.toFixed(4),
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

export function validateWindowsillParams(params: WindowsillParams): WindowsillValidationError[] {
  const errors: WindowsillValidationError[] = [];
  if (!params.length || params.length <= 0) errors.push({ field: "length", message: "Не указана длина подоконника" });
  if (!params.width || params.width <= 0) errors.push({ field: "width", message: "Не указана ширина подоконника" });
  if (params.thickness < 15) errors.push({ field: "thickness", message: `Толщина ${params.thickness} мм меньше минимальных 15 мм` });
  if (params.thickness > 50) errors.push({ field: "thickness", message: `Толщина ${params.thickness} мм превышает максимальные 50 мм` });
  for (const [side, h] of Object.entries(params.drops)) {
    if (h > 200) {
      const sideLabel = side === "front" ? "спереди" : side === "left" ? "слева" : "справа";
      errors.push({ field: `drop_${side}`, message: `Высота опуска ${sideLabel} (${h} мм) не может превышать 200 мм` });
    }
  }
  return errors;
}

export function calculateWindowsill(params: WindowsillParams, pricing: Record<string, number>, colorNames?: string[]): CalculationResult {
  const PRICE_PER_M2 = pricing.windowsill_price_per_m2 || 53200;
  const DENSITY = pricing.density || 2350;
  const INSTALL_PER_KG = pricing.install_price_per_kg || 112;
  const MIN_INSTALL = pricing.min_install_price || 10000;
  const DROP_MULT = pricing.windowsill_drop_multiplier || 1.15;
  const IVORY_MULT = pricing.ivory_color_multiplier || 1.03;
  const CUSTOM_COLOR = pricing.custom_color_surcharge || 3000;

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

  return {
    productLabel: label,
    area: +areaMain.toFixed(4),
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

export function calculateSimpleProduct(
  type: ProductType,
  params: SimpleProductParams,
  pricing: Record<string, number>,
  colorNames?: string[]
): CalculationResult {
  const priceKeyMap: Record<string, string> = {
    backsplash: "backsplash_price_per_m2",
    stair: "stair_price_per_m2",
  };
  const labelMap: Record<string, string> = {
    backsplash: "Фартук",
    stair: "Ступень",
  };

  const PRICE_PER_M2 = pricing[priceKeyMap[type]] || 50000;
  const DENSITY = pricing.density || 2350;
  const INSTALL_PER_KG = pricing.install_price_per_kg || 112;
  const MIN_INSTALL = pricing.min_install_price || 10000;
  const CUSTOM_COLOR = pricing.custom_color_surcharge || 3000;
  const RISER_PRICE_M2 = pricing.stair_riser_price_per_m2 || 40000;

  const stdColors = colorNames || STANDARD_COLORS;
  const area = (params.length * params.width) / 1_000_000;
  const thickness = params.thickness || 30;
  const volume = area * (thickness / 1000);
  let basePrice = area * PRICE_PER_M2;

  const optionItems: { name: string; price: number }[] = [];
  let optionPrice = 0;

  const isCustom = !stdColors.map(c => c.toLowerCase()).includes(params.color.toLowerCase()) && params.color.toLowerCase() !== "белоснежный";
  if (isCustom) {
    optionPrice += CUSTOM_COLOR;
    optionItems.push({ name: `Нестандартный цвет: ${params.color}`, price: CUSTOM_COLOR });
  }
  if (params.color.toLowerCase() === "белоснежный") {
    basePrice *= (pricing.ivory_color_multiplier || 1.03);
  }

  // Stair riser
  if (type === "stair" && params.hasRiser && params.riserHeight && params.riserHeight > 0) {
    const riserArea = (params.length * params.riserHeight) / 1_000_000;
    const riserCost = riserArea * RISER_PRICE_M2;
    optionPrice += riserCost;
    optionItems.push({ name: `Подступенок ${params.riserHeight} мм`, price: Math.round(riserCost) });
  }

  const qty = Math.max(1, params.quantity);
  const totalPrice = Math.round((basePrice + optionPrice) * qty);
  const totalWeight = Math.round(volume * DENSITY * qty);
  const installationPrice = Math.max(MIN_INSTALL, Math.round(totalWeight * INSTALL_PER_KG));

  return {
    productLabel: labelMap[type] || type,
    area: +area.toFixed(4),
    weight: totalWeight,
    basePrice: Math.round(basePrice * qty),
    optionPrice: Math.round(optionPrice * qty),
    optionItems,
    totalPrice,
    installationPrice,
    grandTotal: totalPrice + installationPrice,
    quantity: qty,
    pricePerUnit: Math.round(totalPrice / qty),
  };
}

export function validateStepSlabParams(params: StepSlabParams): StepSlabValidationError[] {
  const errors: StepSlabValidationError[] = [];
  if (params.length < 500) errors.push({ field: "length", message: `Минимальная длина — 500 мм (указано: ${params.length} мм)` });
  if (params.length > 3500) errors.push({ field: "length", message: `Максимальная длина — 3500 мм (указано: ${params.length} мм)` });
  if (params.width < 200) errors.push({ field: "width", message: `Минимальная ширина — 200 мм (указано: ${params.width} мм)` });
  if (params.width > 1500) errors.push({ field: "width", message: `Максимальная ширина — 1500 мм (указано: ${params.width} мм)` });
  if (params.thicknessConcrete < 40) errors.push({ field: "thickness", message: `Минимальная толщина бетона — 40 мм (указано: ${params.thicknessConcrete} мм)` });
  if (params.thicknessConcrete > 60) errors.push({ field: "thickness", message: `Максимальная толщина бетона — 60 мм (указано: ${params.thicknessConcrete} мм)` });
  if (params.isHeated) {
    const total = params.thicknessConcrete + 20;
    if (total > 80) {
      errors.push({ field: "thickness", message: `Общая толщина с подложкой (${params.thicknessConcrete} + 20 = ${total} мм) превышает максимум 80 мм` });
    }
  }
  return errors;
}

export function calculateStepSlab(params: StepSlabParams, pricing: Record<string, number>, colorNames?: string[]): CalculationResult {
  const DENSITY = 2400;
  const PRICE_PER_M2_COLD = pricing.stepslab_price_per_m2 || 25300;
  const PRICE_PER_M2_HEATED = pricing.stepslab_heated_price_per_m2 || 33350;
  const CUSTOM_COLOR = pricing.custom_color_surcharge || 3000;
  const IVORY_MULT = pricing.ivory_color_multiplier || 1.03;
  const WATTS_PER_M2 = 200 / 0.54; // ≈ 370.37 Вт/м²
  const SUBSTRATE_THICKNESS = 20;

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

export function validateSinkParams(params: SinkParams): SinkValidationError[] {
  const errors: SinkValidationError[] = [];

  // Size limits
  if (params.length < 500) {
    errors.push({ field: "length", message: `Минимальная длина раковины — 500 мм (указано: ${params.length} мм)` });
  }
  if (params.length > 4000) {
    errors.push({ field: "length", message: `Максимальная длина раковины — 4000 мм (указано: ${params.length} мм). Рекомендуем разделить на 2 изделия.` });
  }
  if (params.width < 300) {
    errors.push({ field: "width", message: `Минимальная ширина раковины — 300 мм (указано: ${params.width} мм)` });
  }
  if (params.width > 1500) {
    errors.push({ field: "width", message: `Максимальная ширина раковины — 1500 мм (указано: ${params.width} мм)` });
  }

  // Bowl count
  if (params.bowlCount < 1) {
    errors.push({ field: "bowlCount", message: "Раковины без чаши не производятся. Минимум 1 чаша." });
  }
  if (params.bowlCount > 5) {
    errors.push({ field: "bowlCount", message: "Максимум 5 чаш в одной раковине." });
  }

  // Overhang
  if (params.overhangHeight > 300) {
    errors.push({ field: "overhangHeight", message: `Максимальная высота опуска — 300 мм (указано: ${params.overhangHeight} мм)` });
  }

  // Quantity
  if (params.quantity > 10) {
    errors.push({ field: "quantity", message: "Максимум 10 изделий в одном расчёте." });
  }

  return errors;
}

export function calculateSink(params: SinkParams, pricing: Record<string, number>, colorNames?: string[]): CalculationResult {
  const PRICE_PER_SQM = pricing.base_price_per_m2 || 53200;
  const DENSITY = pricing.density || 2350;
  const INSTALL_PER_KG = pricing.install_price_per_kg || 112;
  const MIN_INSTALL = pricing.min_install_price || 12000;
  const CUSTOM_COLOR = pricing.custom_color_surcharge || 3000;
  const OVERHANG_MARKUP = pricing.sink_overhang_markup || 0.15;
  const BOWL_MARKUP = pricing.sink_bowl_markup || 1.5;
  const DRAIN_SLOTTED_PER_M = pricing.sink_drain_slotted_per_m || 6000;
  const IVORY_MARKUP = pricing.ivory_color_multiplier || 1.03;
  const BRACKET_STANDARD_PER_M = pricing.bracket_standard_per_m || 1200;
  const BRACKET_REINFORCED_PER_M = pricing.bracket_reinforced_per_m || 1500;
  const THICKNESS_PLATE = 30; // mm, always fixed
  const THICKNESS_BOWL_WALL = 20;
  const THICKNESS_BOWL_BOTTOM = 20;
  const EDGE_MARGIN = 70;
  const MIN_GAP_BETWEEN_BOWLS = 80;

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
