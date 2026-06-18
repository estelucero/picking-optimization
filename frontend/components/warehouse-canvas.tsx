"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface WarehouseProduct {
  id: number;
  x: number;
  y: number;
  name: string;
  weight?: number;
  codigo?: string;
  kind?: "product" | "deposit" | "bathroom";
  isDeposit?: boolean;
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

type PlacementMode = "product" | "deposit" | "bathroom";

function getProductKind(product: WarehouseProduct): PlacementMode {
  if (product.kind === "deposit" || product.isDeposit || product.codigo === "DEPOSITO") return "deposit";
  if (product.kind === "bathroom" || product.codigo === "BANO") return "bathroom";
  return "product";
}

interface WarehouseCanvasProps {
  config: WarehouseConfig;
  products: WarehouseProduct[];
  placementMode?: PlacementMode;
  onAddProduct: (
    x: number,
    y: number,
    aisle: number,
    row: number,
    shelfIndex: number,
    slotSide: "top" | "bottom",
    slotIndex: number,
    kind?: PlacementMode,
  ) => void;
  onRemoveProduct: (id: number) => void;
  readOnly?: boolean;
}

interface ShelfRect {
  col: number;
  row: number;
  isTopRow?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

const CANVAS_WIDTH = 920;
const CANVAS_HEIGHT = 580;
const PADDING = 28;

export function WarehouseCanvas({
  config,
  products,
  placementMode = "product",
  onAddProduct,
  onRemoveProduct,
  readOnly = false,
}: WarehouseCanvasProps) {
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
    const heightUnits = (shelfRows + 1) * 1 + horizontalStreets * config.horizontalStreetHeight;
    const scale = Math.min(usableW / Math.max(widthUnits, 1), usableH / Math.max(heightUnits, 1));

    const shelfW = config.shelfWidth * scale;
    const shelfH = scale;
    const vStreetW = config.verticalStreetWidth * scale;
    const hStreetH = config.horizontalStreetHeight * scale;

    const gridW = shelfCols * shelfW + verticalStreets * vStreetW;
    const gridH = (shelfRows + 1) * shelfH + horizontalStreets * hStreetH;

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

    let topXCursor = l.startX;
    for (let block = 0; block < l.verticalStreets + 1; block++) {
      for (let s = 0; s < l.shelvesBetweenVertical; s++) {
        const col = block * (l.shelvesBetweenVertical + 1) + s;
        shelves.push({
          col,
          row: 0,
          isTopRow: true,
          x: topXCursor,
          y: l.startY,
          w: l.shelfW,
          h: l.shelfH,
        });
        topXCursor += l.shelfW;
      }
      if (block < l.verticalStreets) {
        const col = block * (l.shelvesBetweenVertical + 1) + l.shelvesBetweenVertical;
        shelves.push({
          col,
          row: 0,
          isTopRow: true,
          x: topXCursor,
          y: l.startY,
          w: l.vStreetW,
          h: l.shelfH,
        });
        topXCursor += l.vStreetW;
      }
    }

    for (let row = 0; row < l.shelfRows; row++) {
      let xCursor = l.startX;
      for (let block = 0; block < l.verticalStreets + 1; block++) {
        for (let s = 0; s < l.shelvesBetweenVertical; s++) {
          const col = block * (l.shelvesBetweenVertical + 1) + s;
          shelves.push({
            col,
            row: row + 1,
            x: xCursor,
            y: l.startY + l.shelfH + l.hStreetH + row * (l.shelfH + l.hStreetH),
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

    // Horizontal streets: the first one separates the special top row from product shelves.
    for (let r = 0; r < l.horizontalStreets; r++) {
      const y = l.startY + l.shelfH + r * (l.shelfH + l.hStreetH);
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
      ctx.fillStyle = shelf.isTopRow ? "#f8fafc" : "#475569";
      ctx.fillRect(shelf.x, shelf.y, shelf.w, shelf.h);

      ctx.strokeStyle = shelf.isTopRow ? "#334155" : "rgba(241,245,249,1)";
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

    // Products and required special locations: one item per cell, centered.
    for (const shelf of shelves) {
      const product = products.find(
        (p) =>
          Math.round(p.x) === shelf.col &&
          Math.round(p.y) === shelf.row,
      );
      if (!product) continue;

      const kind = getProductKind(product);
      const cx = shelf.x + shelf.w / 2;
      const cy = shelf.y + shelf.h / 2;
      const r = Math.max(6, Math.min(10, Math.min(shelf.w, shelf.h) * 0.24));
      if (kind === "product") {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = "#0891b2";
        ctx.fill();
        ctx.strokeStyle = "#e0f2fe";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        const size = Math.max(18, Math.min(34, Math.min(shelf.w, shelf.h) * 0.68));
        ctx.fillStyle = kind === "deposit" ? "#f97316" : "#8b5cf6";
        ctx.strokeStyle = kind === "deposit" ? "#c2410c" : "#6d28d9";
        ctx.lineWidth = 2;
        ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
        ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
      }
      ctx.fillStyle = "#ffffff";
      ctx.font = kind === "product" ? "bold 9px sans-serif" : "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(kind === "deposit" ? "D" : kind === "bathroom" ? "B" : String(product.id), cx, cy);
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

    const occupied = products.find(
      (p) => Math.round(p.x) === clicked.col && Math.round(p.y) === clicked.row,
    );

    if (occupied) {
      if (getProductKind(occupied) === "product") {
        onRemoveProduct(occupied.id);
        setMessage("Ubicacion liberada");
        return;
      }

      setMessage("Deposito y baño se mueven seleccionando su modo y otra celda superior");
      return;
    }

    if (clicked.isTopRow && placementMode === "product") {
      setMessage("La fila superior acepta solo deposito o baño");
      return;
    }

    if (!clicked.isTopRow && placementMode !== "product") {
      setMessage("Deposito y baño solo se ubican en la fila superior");
      return;
    }

    onAddProduct(clicked.col, clicked.row, clicked.col, clicked.row, 0, "top", 0, placementMode);
    setMessage(placementMode === "deposit" ? "Deposito ubicado" : placementMode === "bathroom" ? "Baño ubicado" : "Producto agregado");
  }, [getShelves, onAddProduct, onRemoveProduct, placementMode, products, readOnly]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Plano del deposito</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Fila superior: deposito/baño. Productos desde Y=1.</p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onClick={handleClick} />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">Cada celda acepta 1 elemento. El payload usa DEPOSITO y BANO dentro de productos.</p>
      {message ? <p className="text-xs text-blue-700 dark:text-blue-300">{message}</p> : null}
    </div>
  );
}
