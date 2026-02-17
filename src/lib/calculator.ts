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
  hasRiser?: boolean;       // stair riser
  riserHeight?: number;
  isHeated?: boolean;       // stepslab heated
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
  grandTotal: number;
  quantity: number;
  pricePerUnit: number;
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

  if (params.isRound && params.diameter) {
    const r = params.diameter / 2;
    area = (Math.PI * r * r) / 1_000_000;
    volume = area * (params.thickness / 1000);
    basePrice = area * BASE_PRICE;
    if (params.thickness === 40) basePrice *= THICK_40_MULT;
    if (isIvory) basePrice *= IVORY_MULT;
  } else {
    area = (params.length * params.width) / 1_000_000;
    volume = area * (params.thickness / 1000);
    basePrice = area * BASE_PRICE;
    if (params.thickness === 40) basePrice *= THICK_40_MULT;
    if (isIvory) basePrice *= IVORY_MULT;
  }

  // Supports (only for non-round)
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

  // Drops - work for both round and rectangular
  for (const [side, h] of Object.entries(params.drops)) {
    if (h > 0) {
      let len: number;
      if (params.isRound && params.diameter) {
        // For round: use circumference portion (quarter per side)
        len = Math.PI * params.diameter / 4;
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
  const isCustom = !stdColors.map(c => c.toLowerCase()).includes(params.color.toLowerCase()) && !isIvory;
  if (isCustom) {
    optionPrice += CUSTOM_COLOR;
    optionItems.push({ name: `Нестандартный цвет: ${params.color}`, price: CUSTOM_COLOR });
  }

  const qty = Math.max(1, params.quantity);
  const totalBase = basePrice * qty;
  const totalOpt = optionPrice * qty;
  const totalVol = volume * qty;
  const totalWeight = Math.round(totalVol * DENSITY);
  const totalPrice = Math.round(totalBase + totalOpt);
  const installByWeight = Math.round(totalWeight * INSTALL_PER_KG);
  const installationPrice = Math.max(MIN_INSTALL, installByWeight);

  return {
    productLabel: "Столешница",
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

export function calculateSimpleProduct(
  type: ProductType,
  params: SimpleProductParams,
  pricing: Record<string, number>,
  colorNames?: string[]
): CalculationResult {
  const priceKeyMap: Record<string, string> = {
    windowsill: "windowsill_price_per_m2",
    backsplash: "backsplash_price_per_m2",
    stair: "stair_price_per_m2",
    stepslab: "stepslab_price_per_m2",
  };
  const labelMap: Record<string, string> = {
    windowsill: "Подоконник",
    backsplash: "Фартук",
    stair: "Ступень",
    stepslab: "Пошаговая плита",
  };

  const PRICE_PER_M2 = pricing[priceKeyMap[type]] || 50000;
  const DENSITY = pricing.density || 2350;
  const INSTALL_PER_KG = pricing.install_price_per_kg || 112;
  const MIN_INSTALL = pricing.min_install_price || 10000;
  const CUSTOM_COLOR = pricing.custom_color_surcharge || 3000;
  const RISER_PRICE_M2 = pricing.stair_riser_price_per_m2 || 40000;
  const HEATED_SURCHARGE = pricing.stepslab_heated_surcharge || 5000;

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

  // Stepslab heated
  if (type === "stepslab" && params.isHeated) {
    optionPrice += HEATED_SURCHARGE;
    optionItems.push({ name: "Подогрев", price: HEATED_SURCHARGE });
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
