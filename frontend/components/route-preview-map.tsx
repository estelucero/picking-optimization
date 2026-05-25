"use client";

import { useEffect, useMemo, useRef } from "react";

import type { Coordinate } from "@/lib/ubicaciones";
import type { BackendOperarioRutaItem } from "@/lib/experimentos-rest";

interface RoutePreviewMapProps {
  coordinates: Coordinate[];
  route: BackendOperarioRutaItem[];
}

type Point = {
  x: number;
  y: number;
  label: string;
  markerType: "start" | "visit" | "return";
};

function resolveProductLabel(
  item: BackendOperarioRutaItem,
  coordinates: Coordinate[],
  fallback: number,
): string {
  const byCoordinate = coordinates.find(
    (coord) =>
      !coord.isDeposit &&
      Math.abs(coord.x - item.x) < 0.001 &&
      Math.abs(coord.y - item.y) < 0.001,
  );

  if (byCoordinate && Number.isFinite(byCoordinate.id)) {
    return String(byCoordinate.id);
  }

  const skuMatch = item.codigo?.match(/SKU-(\d+)/i);
  if (skuMatch?.[1]) {
    return String(Number.parseInt(skuMatch[1], 10));
  }

  return String(fallback + 1);
}

const MAP_WIDTH = 500;
const MAP_HEIGHT = 500;
const PRODUCT_RADIUS = 8;
const DEPOSIT_SIZE = 16;
const DRAW_PADDING = 12;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toCanvasPoint(x: number, y: number) {
  const innerWidth = MAP_WIDTH - DRAW_PADDING * 2;
  const innerHeight = MAP_HEIGHT - DRAW_PADDING * 2;
  const scaledX = DRAW_PADDING + (x / MAP_WIDTH) * innerWidth;
  const scaledY = DRAW_PADDING + (y / MAP_HEIGHT) * innerHeight;

  return {
    x: clamp(scaledX, DRAW_PADDING, MAP_WIDTH - DRAW_PADDING),
    y: clamp(scaledY, DRAW_PADDING, MAP_HEIGHT - DRAW_PADDING),
  };
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, MAP_WIDTH, MAP_HEIGHT);
  gradient.addColorStop(0, "#f0f9ff");
  gradient.addColorStop(1, "#e0f2fe");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  ctx.strokeStyle = "#bfdbfe";
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (
    let i = DRAW_PADDING;
    i <= MAP_WIDTH - DRAW_PADDING;
    i += gridSize
  ) {
    ctx.beginPath();
    ctx.moveTo(i, DRAW_PADDING);
    ctx.lineTo(i, MAP_HEIGHT - DRAW_PADDING);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(DRAW_PADDING, i);
    ctx.lineTo(MAP_WIDTH - DRAW_PADDING, i);
    ctx.stroke();
  }
}

function drawPoints(ctx: CanvasRenderingContext2D, coordinates: Coordinate[]) {
  coordinates.forEach((coord, index) => {
    const canvasPoint = toCanvasPoint(coord.x, coord.y);
    const isDeposit = Boolean(coord.isDeposit);
    const productLabel = Number.isFinite(coord.id) ? String(coord.id) : String(index + 1);

    ctx.beginPath();
    if (isDeposit) {
      ctx.rect(
        canvasPoint.x - DEPOSIT_SIZE / 2,
        canvasPoint.y - DEPOSIT_SIZE / 2,
        DEPOSIT_SIZE,
        DEPOSIT_SIZE,
      );
    } else {
      ctx.arc(canvasPoint.x, canvasPoint.y, PRODUCT_RADIUS, 0, Math.PI * 2);
    }
    ctx.fillStyle = isDeposit ? "#ea580c" : "#0891b2";
    ctx.fill();

    ctx.strokeStyle = isDeposit ? "#c2410c" : "#0e7490";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(isDeposit ? "D" : productLabel, canvasPoint.x, canvasPoint.y);
  });
}

function drawMapBorder(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 3;
  ctx.strokeRect(
    DRAW_PADDING,
    DRAW_PADDING,
    MAP_WIDTH - DRAW_PADDING * 2,
    MAP_HEIGHT - DRAW_PADDING * 2,
  );
}

function drawDirectionArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.hypot(dx, dy);
  if (length < 8) return;

  const unitX = dx / length;
  const unitY = dy / length;
  const arrowSize = 14;
  const midX = fromX + dx * 0.5;
  const midY = fromY + dy * 0.5;

  const tipX = midX + unitX * 6;
  const tipY = midY + unitY * 6;
  const baseX = tipX - unitX * arrowSize;
  const baseY = tipY - unitY * arrowSize;
  const perpX = -unitY;
  const perpY = unitX;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseX + perpX * (arrowSize * 0.6), baseY + perpY * (arrowSize * 0.6));
  ctx.lineTo(baseX - perpX * (arrowSize * 0.6), baseY - perpY * (arrowSize * 0.6));
  ctx.closePath();
  ctx.fillStyle = "#b91c1c";
  ctx.fill();
}

function drawManhattanRoute(
  ctx: CanvasRenderingContext2D,
  points: Point[],
) {
  if (points.length < 2) return;

  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (let index = 1; index < points.length; index += 1) {
    const from = toCanvasPoint(points[index - 1].x, points[index - 1].y);
    const to = toCanvasPoint(points[index].x, points[index].y);

    const midX = to.x;
    const midY = from.y;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(midX, midY);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    drawDirectionArrow(ctx, from.x, from.y, midX, midY);
    drawDirectionArrow(ctx, midX, midY, to.x, to.y);
  }

  points.forEach((point) => {
    const canvasPoint = toCanvasPoint(point.x, point.y);
    ctx.beginPath();
    ctx.arc(canvasPoint.x, canvasPoint.y, 10, 0, Math.PI * 2);
    if (point.markerType === "start") {
      ctx.fillStyle = "#dcfce7";
    } else if (point.markerType === "return") {
      ctx.fillStyle = "#ffedd5";
    } else {
      ctx.fillStyle = "#fef2f2";
    }
    ctx.fill();
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#b91c1c";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(point.label, canvasPoint.x, canvasPoint.y);
  });
}

function buildRoutePoints(
  coordinates: Coordinate[],
  route: BackendOperarioRutaItem[],
): Point[] {
  const deposit = coordinates.find((coord) => coord.isDeposit);

  if (!deposit) {
    return route.map((item, index) => ({
      x: item.x,
      y: item.y,
      label: String(index + 1),
      markerType: "visit",
    }));
  }

  return [
    {
      x: deposit.x,
      y: deposit.y,
      label: "S",
      markerType: "start",
    },
    ...route.map((item, index) => ({
      x: item.x,
      y: item.y,
      label: resolveProductLabel(item, coordinates, index),
      markerType: "visit" as const,
    })),
    {
      x: deposit.x,
      y: deposit.y,
      label: "R",
      markerType: "return",
    },
  ];
}

export function RoutePreviewMap({ coordinates, route }: RoutePreviewMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const routePoints = useMemo(
    () => buildRoutePoints(coordinates, route),
    [coordinates, route],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawBackground(ctx);
    drawMapBorder(ctx);
    drawManhattanRoute(ctx, routePoints);
    drawPoints(ctx, coordinates);
  }, [coordinates, routePoints]);

  return (
    <div className="rounded-2xl border border-blue-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
        <span>Deposito: naranja</span>
        <span>Productos: cian</span>
        <span>Camino operario: rojo (Manhattan)</span>
        <span>Salida: S · Regreso: R</span>
        <span>Flechas: direccion del recorrido</span>
      </div>
      <div className="flex justify-center bg-white p-3 dark:bg-slate-900">
        <canvas
          ref={canvasRef}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          className="max-w-full h-auto"
          style={{ touchAction: "none" }}
        />
      </div>
    </div>
  );
}
