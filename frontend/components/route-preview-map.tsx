"use client";

import { useEffect, useMemo, useRef } from "react";

import type { Coordinate, DistributionPaths } from "@/lib/ubicaciones";
import type { BackendOperarioRutaItem } from "@/lib/experimentos-rest";

interface RoutePreviewMapProps {
  coordinates: Coordinate[];
  route: BackendOperarioRutaItem[];
  caminos?: DistributionPaths;
  layoutConfig?: {
    numAisles?: number;
    numRows?: number;
    shelvesBetweenStreets?: number;
  };
}

type LogicalPoint = {
  x: number;
  y: number;
};

type RouteMarker = LogicalPoint & {
  label: string;
  markerType: "start" | "visit" | "return";
};

type RouteNode = LogicalPoint & {
  codeCandidates: string[];
};

type Layout = ReturnType<typeof getLayout>;

const MAP_WIDTH = 1200;
const MAP_HEIGHT = 560;
const PADDING = 16;
const PRODUCT_RADIUS = 8;
const DEPOSIT_SIZE = 16;
const DEFAULT_LAYOUT = {
  numAisles: 4,
  numRows: 4,
  shelvesBetweenStreets: 4,
  verticalStreetWidth: 1.5,
  horizontalStreetHeight: 0.9,
  shelfWidth: 1,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getLayout(layoutConfig?: RoutePreviewMapProps["layoutConfig"]) {
  const verticalStreets = Math.max(0, layoutConfig?.numAisles ?? DEFAULT_LAYOUT.numAisles);
  const horizontalStreets = Math.max(0, layoutConfig?.numRows ?? DEFAULT_LAYOUT.numRows);
  const shelvesBetweenVertical = Math.max(
    1,
    layoutConfig?.shelvesBetweenStreets ?? DEFAULT_LAYOUT.shelvesBetweenStreets,
  );

  const shelfCols = (verticalStreets + 1) * shelvesBetweenVertical;
  const shelfRows = Math.max(1, horizontalStreets - 1);
  const usableW = MAP_WIDTH - PADDING * 2;
  const usableH = MAP_HEIGHT - PADDING * 2;
  const widthUnits =
    shelfCols * DEFAULT_LAYOUT.shelfWidth +
    verticalStreets * DEFAULT_LAYOUT.verticalStreetWidth;
  const heightUnits = shelfRows + horizontalStreets * DEFAULT_LAYOUT.horizontalStreetHeight;
  const scale = Math.min(usableW / Math.max(widthUnits, 1), usableH / Math.max(heightUnits, 1));
  const shelfW = DEFAULT_LAYOUT.shelfWidth * scale;
  const shelfH = scale;
  const vStreetW = DEFAULT_LAYOUT.verticalStreetWidth * scale;
  const hStreetH = DEFAULT_LAYOUT.horizontalStreetHeight * scale;
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
}

function getColumnX(layout: Layout, logicalX: number): number {
  const roundedX = Math.round(logicalX);
  const streetIndex = getVerticalStreetIndex(roundedX, layout.shelvesBetweenVertical);

  if (streetIndex >= 0 && streetIndex < layout.verticalStreets) {
    return (
      layout.startX +
      (streetIndex + 1) * layout.shelvesBetweenVertical * layout.shelfW +
      streetIndex * layout.vStreetW +
      layout.vStreetW / 2
    );
  }

  const streetCountBefore = Math.floor(roundedX / (layout.shelvesBetweenVertical + 1));
  const shelfIndexBefore = roundedX - streetCountBefore;
  return layout.startX + shelfIndexBefore * layout.shelfW + streetCountBefore * layout.vStreetW + layout.shelfW / 2;
}

function getVerticalStreetIndex(logicalX: number, shelvesBetweenVertical: number): number {
  const separation = shelvesBetweenVertical + 1;
  if (logicalX < 0 || logicalX % separation !== shelvesBetweenVertical) {
    return -1;
  }

  return Math.floor(logicalX / separation);
}

function getRowY(layout: Layout, logicalY: number): number {
  const row = clamp(Math.round(logicalY), 0, layout.shelfRows - 1);
  return layout.startY + layout.hStreetH + row * (layout.shelfH + layout.hStreetH) + layout.shelfH / 2;
}

function getStreetY(layout: Layout, logicalY: number): number {
  const street = clamp(Math.round(logicalY), 0, Math.max(0, layout.horizontalStreets - 1));
  return layout.startY + street * (layout.shelfH + layout.hStreetH) + layout.hStreetH / 2;
}

function toCanvasPoint(point: LogicalPoint, layout: Layout, mode: "marker" | "route" = "marker") {
  return {
    x: clamp(getColumnX(layout, point.x), layout.startX, layout.startX + layout.gridW),
    y: clamp(
      mode === "route" ? getStreetY(layout, point.y) : getRowY(layout, point.y),
      layout.startY,
      layout.startY + layout.gridH,
    ),
  };
}

function drawLayout(ctx: CanvasRenderingContext2D, layout: Layout) {
  const gradient = ctx.createLinearGradient(0, 0, MAP_WIDTH, MAP_HEIGHT);
  gradient.addColorStop(0, "#f8fafc");
  gradient.addColorStop(1, "#e2e8f0");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(layout.startX - 8, layout.startY - 8, layout.gridW + 16, layout.gridH + 16);

  for (let row = 0; row < layout.horizontalStreets; row += 1) {
    const y = layout.startY + row * (layout.shelfH + layout.hStreetH);
    ctx.fillStyle = "#bbf7d0";
    ctx.fillRect(layout.startX, y, layout.gridW, layout.hStreetH);
  }

  for (let street = 0; street < layout.verticalStreets; street += 1) {
    const x =
      layout.startX +
      (street + 1) * layout.shelvesBetweenVertical * layout.shelfW +
      street * layout.vStreetW;
    ctx.fillStyle = "#93c5fd";
    ctx.fillRect(x, layout.startY, layout.vStreetW, layout.gridH);
  }

  for (let row = 0; row < layout.shelfRows; row += 1) {
    let xCursor = layout.startX;
    for (let block = 0; block < layout.verticalStreets + 1; block += 1) {
      for (let shelf = 0; shelf < layout.shelvesBetweenVertical; shelf += 1) {
        const y = layout.startY + layout.hStreetH + row * (layout.shelfH + layout.hStreetH);
        const shelfX = xCursor;
        ctx.fillStyle = "#475569";
        ctx.fillRect(shelfX, y, layout.shelfW, layout.shelfH);

        ctx.strokeStyle = "rgba(241,245,249,1)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shelfX, y);
        ctx.lineTo(shelfX, y + layout.shelfH);
        ctx.moveTo(shelfX + layout.shelfW, y);
        ctx.lineTo(shelfX + layout.shelfW, y + layout.shelfH);
        ctx.moveTo(shelfX, y + layout.shelfH);
        ctx.lineTo(shelfX + layout.shelfW, y + layout.shelfH);
        ctx.stroke();

        xCursor += layout.shelfW;
      }

      if (block < layout.verticalStreets) {
        xCursor += layout.vStreetW;
      }
    }
  }

  ctx.strokeStyle = "#1e40af";
  ctx.lineWidth = 2;
  ctx.strokeRect(layout.startX, layout.startY, layout.gridW, layout.gridH);
}

function drawPoints(ctx: CanvasRenderingContext2D, coordinates: Coordinate[], layout: Layout) {
  coordinates.forEach((coord, index) => {
    const canvasPoint = toCanvasPoint(coord, layout);
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

    ctx.strokeStyle = isDeposit ? "#c2410c" : "#e0f2fe";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(isDeposit ? "D" : productLabel, canvasPoint.x, canvasPoint.y);
  });
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
  const arrowSize = 12;
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

function findCoordinateForRouteItem(item: BackendOperarioRutaItem, coordinates: Coordinate[]) {
  return coordinates.find(
    (coord) =>
      !coord.isDeposit &&
      Math.abs(coord.x - item.x) < 0.001 &&
      Math.abs(coord.y - item.y) < 0.001,
  );
}

function buildCodeCandidates(item: BackendOperarioRutaItem, coordinates: Coordinate[]): string[] {
  const byCoordinate = findCoordinateForRouteItem(item, coordinates);
  const candidates = [
    item.codigo,
    byCoordinate?.codigo,
    byCoordinate ? `codigo${byCoordinate.id}` : undefined,
    byCoordinate ? `SKU-${byCoordinate.id}` : undefined,
  ];
  return Array.from(new Set(candidates.filter((value): value is string => Boolean(value))));
}

function getStoredPath(caminos: DistributionPaths | undefined, from: RouteNode, to: RouteNode): LogicalPoint[] | null {
  if (!caminos) return null;

  for (const fromCode of from.codeCandidates) {
    for (const toCode of to.codeCandidates) {
      const direct = caminos[fromCode]?.[toCode];
      if (direct?.length) return direct;

      const reverse = caminos[toCode]?.[fromCode];
      if (reverse?.length) return reverse.slice().reverse();
    }
  }

  return null;
}

function buildDepositCodeCandidates(deposit?: Coordinate): string[] {
  return Array.from(new Set(["DEPOSITO", deposit?.codigo].filter((value): value is string => Boolean(value))));
}

function buildRouteNodes(coordinates: Coordinate[], route: BackendOperarioRutaItem[]): RouteNode[] {
  const deposit = coordinates.find((coord) => coord.isDeposit) ?? { x: 0, y: 0 };
  const depositCodeCandidates = buildDepositCodeCandidates("isDeposit" in deposit ? deposit : undefined);

  return [
    {
      x: deposit.x,
      y: deposit.y,
      codeCandidates: depositCodeCandidates,
    },
    ...route.map((item) => ({
      x: item.x,
      y: item.y,
      codeCandidates: buildCodeCandidates(item, coordinates),
    })),
    {
      x: deposit.x,
      y: deposit.y,
      codeCandidates: depositCodeCandidates,
    },
  ];
}

function isVerticalStreetPoint(point: LogicalPoint, layout: Layout): boolean {
  const streetIndex = getVerticalStreetIndex(Math.round(point.x), layout.shelvesBetweenVertical);
  return streetIndex >= 0 && streetIndex < layout.verticalStreets;
}

function getVerticalStreetXs(layout: Layout): number[] {
  return Array.from({ length: layout.verticalStreets }, (_, index) => {
    return index * (layout.shelvesBetweenVertical + 1) + layout.shelvesBetweenVertical;
  });
}

function getNearestVerticalStreetX(point: LogicalPoint, layout: Layout): number {
  const streets = getVerticalStreetXs(layout);
  if (streets.length === 0) return Math.round(point.x);

  return streets.reduce((closest, current) => {
    return Math.abs(current - point.x) < Math.abs(closest - point.x) ? current : closest;
  }, streets[0]);
}

function getPreferredVerticalStreetX(from: LogicalPoint, to: LogicalPoint, layout: Layout): number {
  if (isVerticalStreetPoint(from, layout)) return Math.round(from.x);
  if (isVerticalStreetPoint(to, layout)) return Math.round(to.x);

  const streets = getVerticalStreetXs(layout);
  if (streets.length === 0) return Math.round(from.x);

  return streets.reduce((best, current) => {
    const bestCost = Math.abs(best - from.x) + Math.abs(best - to.x);
    const currentCost = Math.abs(current - from.x) + Math.abs(current - to.x);
    return currentCost < bestCost ? current : best;
  }, getNearestVerticalStreetX(from, layout));
}

function pushPoint(points: LogicalPoint[], point: LogicalPoint) {
  const last = points[points.length - 1];
  if (last && Math.round(last.x) === Math.round(point.x) && Math.round(last.y) === Math.round(point.y)) {
    return;
  }

  points.push(point);
}

function expandOrthogonalPolyline(points: LogicalPoint[], layout: Layout): LogicalPoint[] {
  if (points.length < 2) return points;

  const expanded: LogicalPoint[] = [points[0]];

  for (let index = 1; index < points.length; index += 1) {
    const from = expanded[expanded.length - 1];
    const to = points[index];
    const sameX = Math.round(from.x) === Math.round(to.x);
    const sameY = Math.round(from.y) === Math.round(to.y);

    if (!sameY) {
      const streetX = getPreferredVerticalStreetX(from, to, layout);
      pushPoint(expanded, { x: streetX, y: from.y });
      pushPoint(expanded, { x: streetX, y: to.y });

      if (!sameX || Math.round(to.x) !== streetX) {
        pushPoint(expanded, to);
      }

      continue;
    }

    pushPoint(expanded, to);
  }

  return expanded;
}

function buildPolyline(
  coordinates: Coordinate[],
  route: BackendOperarioRutaItem[],
  layout: Layout,
  caminos?: DistributionPaths,
): LogicalPoint[] {
  const nodes = buildRouteNodes(coordinates, route);
  const points: LogicalPoint[] = [];

  for (let index = 1; index < nodes.length; index += 1) {
    const from = nodes[index - 1];
    const to = nodes[index];
    const segment = getStoredPath(caminos, from, to) ?? [from, to];

    segment.forEach((point, pointIndex) => {
      if (index > 1 && pointIndex === 0) return;
      points.push(point);
    });
  }

  return expandOrthogonalPolyline(points, layout);
}

function buildRouteMarkers(coordinates: Coordinate[], route: BackendOperarioRutaItem[]): RouteMarker[] {
  const deposit = coordinates.find((coord) => coord.isDeposit) ?? { x: 0, y: 0 };

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

function drawRoute(
  ctx: CanvasRenderingContext2D,
  polyline: LogicalPoint[],
  markers: RouteMarker[],
  layout: Layout,
) {
  if (polyline.length >= 2) {
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    for (let index = 1; index < polyline.length; index += 1) {
      const from = toCanvasPoint(polyline[index - 1], layout, "route");
      const to = toCanvasPoint(polyline[index], layout, "route");
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      drawDirectionArrow(ctx, from.x, from.y, to.x, to.y);
    }
  }

  markers.forEach((marker) => {
    const canvasPoint = toCanvasPoint(marker, layout);
    ctx.beginPath();
    ctx.arc(canvasPoint.x, canvasPoint.y, 10, 0, Math.PI * 2);
    if (marker.markerType === "start") {
      ctx.fillStyle = "#dcfce7";
    } else if (marker.markerType === "return") {
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
    ctx.fillText(marker.label, canvasPoint.x, canvasPoint.y);
  });
}

export function RoutePreviewMap({ coordinates, route, caminos, layoutConfig }: RoutePreviewMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layout = useMemo(() => getLayout(layoutConfig), [layoutConfig]);
  const routePolyline = useMemo(
    () => buildPolyline(coordinates, route, layout, caminos),
    [coordinates, route, layout, caminos],
  );
  const routeMarkers = useMemo(
    () => buildRouteMarkers(coordinates, route),
    [coordinates, route],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawLayout(ctx, layout);
    drawPoints(ctx, coordinates, layout);
    drawRoute(ctx, routePolyline, routeMarkers, layout);
  }, [coordinates, layout, routeMarkers, routePolyline]);

  return (
    <div className="flex max-h-[58vh] min-h-[460px] items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
      <canvas
        ref={canvasRef}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        className="h-auto max-h-[58vh] w-full max-w-[1200px] rounded-xl bg-white"
      />
    </div>
  );
}
