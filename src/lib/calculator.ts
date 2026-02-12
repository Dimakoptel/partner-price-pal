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
  color: string;
  drainType: string;
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
  basePrice: number;
  optionPrice: number;
  optionItems: { name: string; price: number }[];
  totalPrice: number;
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

export function calculateSink(params: SinkParams, pricing: Record<string, number>, colorNames?: string[]): CalculationResult {
  const BASE_PRICE = pricing.sink_base_price_per_m2 || 85000;
  const BOWL_PRICE = pricing.sink_bowl_price || 15000;
  const DRAIN_PRICE = pricing.sink_drain_price || 5000;
  const DENSITY = pricing.density || 2350;
  const INSTALL_PER_KG = pricing.install_price_per_kg || 112;
  const MIN_INSTALL = pricing.min_install_price || 10000;
  const CUSTOM_COLOR = pricing.custom_color_surcharge || 3000;
  const DROP_MULT = pricing.drop_multiplier || 1.1;

  const stdColors = colorNames || STANDARD_COLORS;
  const area = (params.length * params.width) / 1_000_000;
  const thickness = 30;
  const volume = area * (thickness / 1000);
  let basePrice = area * BASE_PRICE;

  const optionItems: { name: string; price: number }[] = [];
  let optionPrice = 0;

  const bowlCost = params.bowlCount * BOWL_PRICE;
  optionPrice += bowlCost;
  optionItems.push({ name: `Чаша x${params.bowlCount}`, price: bowlCost });

  if (params.drainType) {
    optionPrice += DRAIN_PRICE;
    optionItems.push({ name: `Слив: ${params.drainType}`, price: DRAIN_PRICE });
  }

  if (params.overhangHeight > 0) {
    const sides = params.overhangSides;
    let overhangLength = 0;
    if (sides.front) overhangLength += params.length;
    if (sides.back) overhangLength += params.length;
    if (sides.left) overhangLength += params.width;
    if (sides.right) overhangLength += params.width;
    if (overhangLength > 0) {
      const ohArea = (overhangLength * params.overhangHeight) / 1_000_000;
      const ohCost = ohArea * BASE_PRICE * DROP_MULT;
      optionPrice += ohCost;
      optionItems.push({ name: `Опуски ${params.overhangHeight} мм`, price: Math.round(ohCost) });
    }
  }

  const isCustom = !stdColors.map(c => c.toLowerCase()).includes(params.color.toLowerCase()) && params.color.toLowerCase() !== "белоснежный";
  if (isCustom) {
    optionPrice += CUSTOM_COLOR;
    optionItems.push({ name: `Нестандартный цвет: ${params.color}`, price: CUSTOM_COLOR });
  }
  if (params.color.toLowerCase() === "белоснежный") {
    basePrice *= (pricing.ivory_color_multiplier || 1.03);
  }

  const qty = Math.max(1, params.quantity);
  const totalPrice = Math.round((basePrice + optionPrice) * qty);
  const totalWeight = Math.round(volume * DENSITY * qty);
  const installationPrice = Math.max(MIN_INSTALL, Math.round(totalWeight * INSTALL_PER_KG));

  return {
    productLabel: "Раковина",
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
