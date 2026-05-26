"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface WarehouseProduct {
  id: number;
  x: number;
  y: number;
  name: string;
  weight?: number;
  aisle?: number;
  row?: number;
  shelfIndex?: number;
  slotSide?: "top" | "bottom";
  slotIndex?: number;
}

export interface WarehouseConfig {
  warehouseWidth: number;
  warehouseHeight: number;
  numAisles: number;
  numRows: number;
  shelvesBetweenStreets: number;
  verticalStreetWidth: number;
  verticalStreetHeight: number;
  horizontalStreetWidth: number;
  horizontalStreetHeight: number;
  shelfWidth: number;
  shelfPlacementMode: "both" | "top" | "bottom";
}

interface WarehouseCanvasProps {
  config: WarehouseConfig;
  products: WarehouseProduct[];
  onAddProduct: (
    x: number,
    y: number,
    aisle: number,
    row: number,
    shelfIndex: number,
    slotSide: "top" | "bottom",
    slotIndex: number,
  ) => void;
  onRemoveProduct: (id: number) => void;
  readOnly?: boolean;
}

interface ShelfRect {
  col: number;
  row: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface HalfRect {
  shelf: ShelfRect;
  side: "top" | "bottom";
  x: number;
  y: number;
  w: number;
  h: number;
}

const CANVAS_WIDTH = 920;
const CANVAS_HEIGHT = 580;
const PADDING = 28;

export function WarehouseCanvas({ config, products, onAddProduct, onRemoveProduct, readOnly = false }: WarehouseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState("");

  const getLayout = useCallback(() => {
    const verticalStreets = Math.max(0, config.numAisles);
    const horizontalStreets = Math.max(0, config.numRows);
    const shelvesBetweenVertical = Math.max(1, config.shelvesBetweenStreets);

    const shelfCols = (verticalStreets + 1) * shelvesBetweenVertical;
    const shelfRows = horizontalStreets + 1;

    const usableW = CANVAS_WIDTH - PADDING * 2;
    const usableH = CANVAS_HEIGHT - PADDING * 2;

    const widthUnits = shelfCols * config.shelfWidth + verticalStreets * config.verticalStreetWidth;
    const heightUnits = shelfRows * 1 + horizontalStreets * config.horizontalStreetHeight;
    const scale = Math.min(usableW / Math.max(widthUnits, 1), usableH / Math.max(heightUnits, 1));

    const shelfW = config.shelfWidth * scale;
    const shelfH = scale;
    const vStreetW = config.verticalStreetWidth * scale;
    const hStreetH = config.horizontalStreetHeight * scale;

    const gridW = shelfCols * shelfW + verticalStreets * vStreetW;
    const gridH = shelfRows * shelfH + horizontalStreets * hStreetH;

    return {
      verticalStreets,
      horizontalStreets,
      shelvesBetweenVertical,
      shelfCols,
      shelfRows,
      shelfW,
      shelfH,
      vStreetW,
      hStreetH,
      startX: PADDING + (usableW - gridW) / 2,
      startY: PADDING + (usableH - gridH) / 2,
      gridW,
      gridH,
    };
  }, [config.horizontalStreetHeight, config.numAisles, config.numRows, config.shelfWidth, config.shelvesBetweenStreets, config.verticalStreetWidth]);

  const getShelves = useCallback((): ShelfRect[] => {
    const l = getLayout();
    const shelves: ShelfRect[] = [];

    for (let row = 0; row < l.shelfRows; row++) {
      let xCursor = l.startX;
      for (let block = 0; block < l.verticalStreets + 1; block++) {
        for (let s = 0; s < l.shelvesBetweenVertical; s++) {
          const col = block * l.shelvesBetweenVertical + s;
          shelves.push({
            col,
            row,
            x: xCursor,
            y: l.startY + row * l.shelfH + row * l.hStreetH,
            w: l.shelfW,
            h: l.shelfH,
          });
          xCursor += l.shelfW;
        }
        if (block < l.verticalStreets) {
          xCursor += l.vStreetW;
        }
      }
    }

    return shelves;
  }, [getLayout]);

  const getHalves = useCallback((shelves: ShelfRect[]): HalfRect[] => {
    const halves: HalfRect[] = [];
    for (const shelf of shelves) {
      if (config.shelfPlacementMode === "both") {
        const half = shelf.h / 2;
        halves.push({ shelf, side: "top", x: shelf.x, y: shelf.y, w: shelf.w, h: half });
        halves.push({ shelf, side: "bottom", x: shelf.x, y: shelf.y + half, w: shelf.w, h: half });
      } else if (config.shelfPlacementMode === "top") {
        halves.push({ shelf, side: "top", x: shelf.x, y: shelf.y, w: shelf.w, h: shelf.h });
      } else {
        halves.push({ shelf, side: "bottom", x: shelf.x, y: shelf.y, w: shelf.w, h: shelf.h });
      }
    }
    return halves;
  }, [config.shelfPlacementMode]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const l = getLayout();
    const shelves = getShelves();
    const halves = getHalves(shelves);

    const bg = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bg.addColorStop(0, "#f8fafc");
    bg.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(l.startX - 8, l.startY - 8, l.gridW + 16, l.gridH + 16);

    // Horizontal streets: exactly H
    for (let r = 0; r < l.horizontalStreets; r++) {
      const y = l.startY + (r + 1) * l.shelfH + r * l.hStreetH;
      ctx.fillStyle = "#bbf7d0";
      ctx.fillRect(l.startX, y, l.gridW, l.hStreetH);
    }

    // Vertical streets: exactly V
    for (let v = 0; v < l.verticalStreets; v++) {
      const x = l.startX + (v + 1) * l.shelvesBetweenVertical * l.shelfW + v * l.vStreetW;
      ctx.fillStyle = "#93c5fd";
      ctx.fillRect(x, l.startY, l.vStreetW, l.gridH);
    }

    // Shelves
    for (const shelf of shelves) {
      ctx.fillStyle = "#475569";
      ctx.fillRect(shelf.x, shelf.y, shelf.w, shelf.h);
      if (config.shelfPlacementMode === "both") {
        ctx.strokeStyle = "rgba(241,245,249,0.9)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(shelf.x, shelf.y + shelf.h / 2);
        ctx.lineTo(shelf.x + shelf.w, shelf.y + shelf.h / 2);
        ctx.stroke();
      }
    }

    // Products (max 1 top + 1 bottom per shelf by lookup logic)
    for (const half of halves) {
      const product = products.find(
        (p) => (p.aisle ?? 0) === half.shelf.col && (p.row ?? 0) === half.shelf.row && (p.slotSide ?? "top") === half.side,
      );
      if (!product) continue;

      const cx = half.x + half.w / 2;
      const cy = half.y + half.h / 2;
      const r = Math.max(6, Math.min(10, Math.min(half.w, half.h) * 0.24));
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#0891b2";
      ctx.fill();
      ctx.strokeStyle = "#e0f2fe";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(product.id), cx, cy);
    }

    ctx.strokeStyle = "#1e40af";
    ctx.lineWidth = 2;
    ctx.strokeRect(l.startX, l.startY, l.gridW, l.gridH);
  }, [config.shelfPlacementMode, getHalves, getLayout, getShelves, products]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const mouse = getMouse(e);
    if (!mouse) return;

    const halves = getHalves(getShelves());
    const clicked = halves.find((h) => mouse.x >= h.x && mouse.x <= h.x + h.w && mouse.y >= h.y && mouse.y <= h.y + h.h);
    if (!clicked) return;

    const occupied = products.find(
      (p) => (p.aisle ?? 0) === clicked.shelf.col && (p.row ?? 0) === clicked.shelf.row && (p.slotSide ?? "top") === clicked.side,
    );

    if (occupied) {
      onRemoveProduct(occupied.id);
      setMessage("Producto eliminado");
      return;
    }

    onAddProduct(clicked.shelf.col, clicked.shelf.row, clicked.shelf.col, clicked.shelf.row, 0, clicked.side, 0);
    setMessage("Producto agregado");
  }, [getHalves, getShelves, onAddProduct, onRemoveProduct, products, readOnly]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Plano del deposito</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">V calles azules, H calles verdes, E estanterias entre calles</p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onClick={handleClick} />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">Cada estanteria acepta 1 producto arriba y 1 abajo.</p>
      {message ? <p className="text-xs text-blue-700 dark:text-blue-300">{message}</p> : null}
    </div>
  );
}
