// ==========================================
// Box Calculator — Transportation Box
// Ported from Box Builder Pro project
// ==========================================

// ===== TYPES =====

export interface Part {
  w: number;
  h: number;
  quantity: number;
  name: string;
}

export interface PlacedPart {
  x: number;
  y: number;
  w: number;
  h: number;
  originalW: number;
  originalH: number;
  name: string;
  rotated: boolean;
}

export interface Sheet {
  width: number;
  height: number;
  parts: PlacedPart[];
  usedArea: number;
}

export interface BeamPart {
  length: number;
  name: string;
  quantity: number;
}

export interface PlacedBeamPart {
  length: number;
  name: string;
  start: number;
}

export interface Beam {
  parts: PlacedBeamPart[];
  used: number;
  remaining: number;
  totalLength: number;
}

export interface BoxDimensions {
  itemL: number;
  itemW: number;
  itemH: number;
  boxCount: number;
  ospThick: number;
  foamThick: number;
  foamLongSideL: number;
  foamLongSideH: number;
  foamShortSideW: number;
  foamShortSideH: number;
  foamBottomL: number;
  foamBottomW: number;
  ospLongSideL: number;
  ospLongSideH: number;
  ospShortSideW: number;
  ospShortSideH: number;
  ospBottomL: number;
  ospBottomW: number;
  beamLong: number;
  beamShort: number;
  beamCorner: number;
  beamW: number;
  beamH: number;
}

export interface MaterialSettings {
  osp: { length: number; width: number; thickness: number; price: number };
  foam: { length: number; width: number; thickness: number; price: number };
  beam: { width: number; height: number; standardLength: number; price: number };
}

export const defaultMaterials: MaterialSettings = {
  osp: { length: 2500, width: 1250, thickness: 9, price: 565 },
  foam: { length: 1185, width: 585, thickness: 10, price: 110 },
  beam: { width: 40, height: 30, standardLength: 3000, price: 200 },
};

export interface BoxCalculationResult {
  dimensions: BoxDimensions;
  ospSheets: Sheet[];
  foamSheets: Sheet[];
  beamCutting: Beam[];
  materials: MaterialSettings;
  costs: { osp: number; foam: number; beam: number; total: number };
}

// ===== BOX DIMENSIONS CALCULATION =====

export function calculateBoxDimensions(
  itemL: number, itemW: number, itemH: number, boxCount: number,
  ospThick: number, foamThick: number, beamW: number, beamH: number
): BoxDimensions {
  const foamLongSideL = itemL + 20;
  const foamLongSideH = itemH;
  const foamShortSideW = itemW;
  const foamShortSideH = itemH;
  const foamBottomL = itemL + 20;
  const foamBottomW = itemW + 20;

  // OSP outer dimensions account for foam thickness on each side
  const beamOffset = 2 * beamW - 2; // frame offset for long sides/bottom
  const ospLongSideL = foamLongSideL + beamOffset;
  const ospLongSideH = foamLongSideH + 2 * foamThick;
  const ospShortSideW = foamShortSideW + 2 * foamThick;
  const ospShortSideH = foamShortSideH + 2 * foamThick;
  const ospBottomL = foamBottomL + beamOffset;
  const ospBottomW = foamBottomW + beamOffset;

  const beamLong = ospLongSideL;
  const beamShort = ospShortSideW;
  const beamCorner = itemH - 2 * beamH;

  return {
    itemL, itemW, itemH, boxCount, ospThick, foamThick,
    foamLongSideL, foamLongSideH, foamShortSideW, foamShortSideH, foamBottomL, foamBottomW,
    ospLongSideL, ospLongSideH, ospShortSideW, ospShortSideH, ospBottomL, ospBottomW,
    beamLong, beamShort, beamCorner, beamW, beamH,
  };
}

// ===== SHEET CUTTING (Guillotine / FFDH) =====

export function optimizedCutting(sheetW: number, sheetH: number, parts: Part[], kerf: number = 4): Sheet[] {
  const allParts: { w: number; h: number; name: string; area: number; originalW: number; originalH: number }[] = [];
  parts.forEach((part) => {
    for (let i = 0; i < part.quantity; i++) {
      allParts.push({ w: part.w, h: part.h, name: part.name, area: part.w * part.h, originalW: part.w, originalH: part.h });
    }
  });
  allParts.sort((a, b) => (b.h !== a.h ? b.h - a.h : b.w - a.w));

  const sheets: Sheet[] = [];

  interface Shelf { y: number; height: number; remainingWidth: number; currentX: number }
  interface SheetWithShelves { sheet: Sheet; shelves: Shelf[]; remainingHeight: number }

  const sheetsWithShelves: SheetWithShelves[] = [];

  for (const part of allParts) {
    let placed = false;
    const orientations = [
      { w: part.w, h: part.h, rotated: false },
      { w: part.h, h: part.w, rotated: true },
    ];

    for (const orientation of orientations) {
      if (placed) break;
      const partW = orientation.w + kerf;
      const partH = orientation.h + kerf;
      if (partW > sheetW || partH > sheetH) continue;

      for (const sws of sheetsWithShelves) {
        if (placed) break;
        for (const shelf of sws.shelves) {
          if (partH <= shelf.height + kerf && partW <= shelf.remainingWidth) {
            sws.sheet.parts.push({ x: shelf.currentX, y: shelf.y, w: orientation.w, h: orientation.h, originalW: part.originalW, originalH: part.originalH, name: part.name, rotated: orientation.rotated });
            sws.sheet.usedArea += orientation.w * orientation.h;
            shelf.currentX += partW;
            shelf.remainingWidth -= partW;
            placed = true;
            break;
          }
        }
        if (!placed && partH <= sws.remainingHeight) {
          const shelfY = sheetH - sws.remainingHeight;
          sws.shelves.push({ y: shelfY, height: orientation.h, remainingWidth: sheetW - partW, currentX: partW });
          sws.remainingHeight -= orientation.h + kerf;
          sws.sheet.parts.push({ x: 0, y: shelfY, w: orientation.w, h: orientation.h, originalW: part.originalW, originalH: part.originalH, name: part.name, rotated: orientation.rotated });
          sws.sheet.usedArea += orientation.w * orientation.h;
          placed = true;
        }
      }
      if (placed) break;
    }

    if (!placed) {
      const sheet: Sheet = { width: sheetW, height: sheetH, parts: [], usedArea: 0 };
      sheets.push(sheet);
      const sws: SheetWithShelves = { sheet, shelves: [], remainingHeight: sheetH };
      sheetsWithShelves.push(sws);

      let useW = part.w, useH = part.h, rotated = false;
      if (part.w + kerf > sheetW || part.h + kerf > sheetH) {
        if (part.h + kerf <= sheetW && part.w + kerf <= sheetH) { useW = part.h; useH = part.w; rotated = true; }
      }
      sws.shelves.push({ y: 0, height: useH, remainingWidth: sheetW - (useW + kerf), currentX: useW + kerf });
      sws.remainingHeight -= useH + kerf;
      sws.sheet.parts.push({ x: 0, y: 0, w: useW, h: useH, originalW: part.originalW, originalH: part.originalH, name: part.name, rotated });
      sws.sheet.usedArea += useW * useH;
    }
  }
  return sheets;
}

// ===== BEAM CUTTING (1D bin packing, Best Fit Decreasing) =====

export function beamCutting1D(beamLength: number, parts: BeamPart[], kerf: number = 3): Beam[] {
  const allParts: { length: number; name: string }[] = [];
  parts.forEach((part) => {
    for (let i = 0; i < part.quantity; i++) {
      allParts.push({ length: part.length, name: part.name });
    }
  });
  allParts.sort((a, b) => b.length - a.length);

  const beams: Beam[] = [];
  for (const part of allParts) {
    let bestBeam: Beam | null = null;
    let minWaste = Infinity;
    for (const beam of beams) {
      if (beam.remaining >= part.length + kerf) {
        const waste = beam.remaining - (part.length + kerf);
        if (waste < minWaste) { minWaste = waste; bestBeam = beam; }
      }
    }
    if (bestBeam) {
      bestBeam.parts.push({ ...part, start: bestBeam.used });
      bestBeam.used += part.length + kerf;
      bestBeam.remaining -= part.length + kerf;
    } else {
      beams.push({
        parts: [{ ...part, start: 0 }],
        used: part.length + kerf,
        remaining: beamLength - part.length - kerf,
        totalLength: beamLength,
      });
    }
  }
  return beams;
}

// ===== FULL BOX CALCULATION =====

export function calculateBox(
  itemL: number, itemW: number, itemH: number, boxCount: number,
  materials: MaterialSettings
): BoxCalculationResult {
  const dimensions = calculateBoxDimensions(
    itemL, itemW, itemH, boxCount,
    materials.osp.thickness, materials.foam.thickness,
    materials.beam.width, materials.beam.height
  );

  const ospParts: Part[] = [
    { w: dimensions.ospLongSideL, h: dimensions.ospLongSideH, quantity: 2 * boxCount, name: `Боковина L (${dimensions.ospLongSideL.toFixed(0)}×${dimensions.ospLongSideH.toFixed(0)})` },
    { w: dimensions.ospShortSideW, h: dimensions.ospShortSideH, quantity: 2 * boxCount, name: `Боковина W (${dimensions.ospShortSideW.toFixed(0)}×${dimensions.ospShortSideH.toFixed(0)})` },
    { w: dimensions.ospBottomL, h: dimensions.ospBottomW, quantity: 2 * boxCount, name: `Дно/Крышка (${dimensions.ospBottomL.toFixed(0)}×${dimensions.ospBottomW.toFixed(0)})` },
  ];
  const foamParts: Part[] = [
    { w: dimensions.foamLongSideL, h: dimensions.foamLongSideH, quantity: 2 * boxCount, name: `Прокладка L (${dimensions.foamLongSideL.toFixed(0)}×${dimensions.foamLongSideH.toFixed(0)})` },
    { w: dimensions.foamShortSideW, h: dimensions.foamShortSideH, quantity: 2 * boxCount, name: `Прокладка W (${dimensions.foamShortSideW.toFixed(0)}×${dimensions.foamShortSideH.toFixed(0)})` },
    { w: dimensions.foamBottomL, h: dimensions.foamBottomW, quantity: 2 * boxCount, name: `Вкладыш Д/К (${dimensions.foamBottomL.toFixed(0)}×${dimensions.foamBottomW.toFixed(0)})` },
  ];
  const beamParts: BeamPart[] = [
    { length: dimensions.beamLong, name: "Планка длинная", quantity: 4 * boxCount },
    { length: dimensions.beamShort, name: "Планка короткая", quantity: 4 * boxCount },
    { length: dimensions.beamCorner, name: "Угловая вставка", quantity: 4 * boxCount },
  ];

  const ospSheets = optimizedCutting(materials.osp.length, materials.osp.width, ospParts, 4);
  const foamSheets = optimizedCutting(materials.foam.length, materials.foam.width, foamParts, 3);
  const beamCuttingResult = beamCutting1D(materials.beam.standardLength, beamParts, 3);

  return {
    dimensions,
    ospSheets,
    foamSheets,
    beamCutting: beamCuttingResult,
    materials,
    costs: {
      osp: ospSheets.length * materials.osp.price,
      foam: foamSheets.length * materials.foam.price,
      beam: beamCuttingResult.length * materials.beam.price,
      total: ospSheets.length * materials.osp.price + foamSheets.length * materials.foam.price + beamCuttingResult.length * materials.beam.price,
    },
  };
}

// ===== LOCAL STORAGE FOR MATERIALS =====

const STORAGE_KEY = "cozyBoxMaterials";

export function saveMaterials(materials: MaterialSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
}

export function loadMaterials(): MaterialSettings {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { return defaultMaterials; }
  }
  return defaultMaterials;
}
