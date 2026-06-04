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
    const shelfRows = Math.max(1, horizontalStreets - 1);

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
          const col = block * (l.shelvesBetweenVertical + 1) + s;
          shelves.push({
            col,
            row,
            x: xCursor,
            y: l.startY + l.hStreetH + row * l.shelfH + row * l.hStreetH,
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

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const l = getLayout();
    const shelves = getShelves();

    const bg = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bg.addColorStop(0, "#f8fafc");
    bg.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(l.startX - 8, l.startY - 8, l.gridW + 16, l.gridH + 16);

    // Horizontal streets: exactly H, including top and bottom borders
    for (let r = 0; r < l.horizontalStreets; r++) {
      const y = l.startY + r * (l.shelfH + l.hStreetH);
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

      ctx.strokeStyle = "rgba(241,245,249,1)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shelf.x, shelf.y);
      ctx.lineTo(shelf.x, shelf.y + shelf.h);
      ctx.moveTo(shelf.x + shelf.w, shelf.y);
      ctx.lineTo(shelf.x + shelf.w, shelf.y + shelf.h);
      ctx.moveTo(shelf.x, shelf.y + shelf.h);
      ctx.lineTo(shelf.x + shelf.w, shelf.y + shelf.h);
      ctx.stroke();
    }

    // Products: one product per shelf, centered in the shelf body.
    for (const shelf of shelves) {
      const product = products.find(
        (p) =>
          !(p.x === 0 && p.y === 0) &&
          Math.round(p.x) === shelf.col &&
          Math.round(p.y) === shelf.row,
      );
      if (!product) continue;

      const cx = shelf.x + shelf.w / 2;
      const cy = shelf.y + shelf.h / 2;
      const r = Math.max(6, Math.min(10, Math.min(shelf.w, shelf.h) * 0.24));
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
  }, [getLayout, getShelves, products]);

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

    const shelves = getShelves();
    const clicked = shelves.find((shelf) => mouse.x >= shelf.x && mouse.x <= shelf.x + shelf.w && mouse.y >= shelf.y && mouse.y <= shelf.y + shelf.h);
    if (!clicked) return;

    if (clicked.col === 0 && clicked.row === 0) {
      setMessage("Ubicacion reservada para el deposito");
      return;
    }

    const occupied = products.find(
      (p) => Math.round(p.x) === clicked.col && Math.round(p.y) === clicked.row,
    );

    if (occupied) {
      onRemoveProduct(occupied.id);
      setMessage("Producto eliminado");
      return;
    }

    onAddProduct(clicked.col, clicked.row, clicked.col, clicked.row, 0, "top", 0);
    setMessage("Producto agregado");
  }, [getShelves, onAddProduct, onRemoveProduct, products, readOnly]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Plano del deposito</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">V calles azules, H calles verdes, E estanterias entre calles</p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onClick={handleClick} />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">Cada estanteria acepta 1 producto.</p>
      {message ? <p className="text-xs text-blue-700 dark:text-blue-300">{message}</p> : null}
    </div>
  );
}
