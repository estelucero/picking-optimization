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

type RouteMarkerInput = LogicalPoint & {
  label: string;
  codeCandidates: string[];
};

type CanvasPoint = {
  x: number;
  y: number;
};

type DrawableSegment = {
  from: CanvasPoint;
  to: CanvasPoint;
  orientation: "horizontal" | "vertical";
  rangeStart: number;
  rangeEnd: number;
  lane: number;
  laneCount: number;
};

type OffsetDrawableSegment = DrawableSegment & {
  offsetFrom: CanvasPoint;
  offsetTo: CanvasPoint;
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

function isDepositCoordinate(coord: Coordinate): boolean {
  return Boolean(coord.isDeposit) || coord.kind === "deposit" || coord.codigo === "DEPOSITO";
}

function isBathroomCoordinate(coord: Coordinate): boolean {
  return coord.kind === "bathroom" || coord.codigo === "BANO";
}

function isSpecialCoordinate(coord: Coordinate): boolean {
  return isDepositCoordinate(coord) || isBathroomCoordinate(coord);
}

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
  const heightUnits = (shelfRows + 1) + horizontalStreets * DEFAULT_LAYOUT.horizontalStreetHeight;
  const scale = Math.min(usableW / Math.max(widthUnits, 1), usableH / Math.max(heightUnits, 1));
  const shelfW = DEFAULT_LAYOUT.shelfWidth * scale;
  const shelfH = scale;
  const vStreetW = DEFAULT_LAYOUT.verticalStreetWidth * scale;
  const hStreetH = DEFAULT_LAYOUT.horizontalStreetHeight * scale;
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
  const roundedY = Math.round(logicalY);
  if (roundedY <= 0) {
    return layout.startY + layout.shelfH / 2;
  }

  const row = clamp(roundedY - 1, 0, layout.shelfRows - 1);
  return layout.startY + layout.shelfH + layout.hStreetH + row * (layout.shelfH + layout.hStreetH) + layout.shelfH / 2;
}

function getStreetY(layout: Layout, logicalY: number): number {
  const street = clamp(Math.round(logicalY), 0, Math.max(0, layout.horizontalStreets - 1));
  return layout.startY + layout.shelfH + street * (layout.shelfH + layout.hStreetH) + layout.hStreetH / 2;
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
    const y = layout.startY + layout.shelfH + row * (layout.shelfH + layout.hStreetH);
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

  let topXCursor = layout.startX;
  for (let block = 0; block < layout.verticalStreets + 1; block += 1) {
    for (let shelf = 0; shelf < layout.shelvesBetweenVertical; shelf += 1) {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(topXCursor, layout.startY, layout.shelfW, layout.shelfH);

      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(topXCursor, layout.startY);
      ctx.lineTo(topXCursor, layout.startY + layout.shelfH);
      ctx.moveTo(topXCursor + layout.shelfW, layout.startY);
      ctx.lineTo(topXCursor + layout.shelfW, layout.startY + layout.shelfH);
      ctx.moveTo(topXCursor, layout.startY + layout.shelfH);
      ctx.lineTo(topXCursor + layout.shelfW, layout.startY + layout.shelfH);
      ctx.stroke();

      topXCursor += layout.shelfW;
    }

    if (block < layout.verticalStreets) {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(topXCursor, layout.startY, layout.vStreetW, layout.shelfH);

      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(topXCursor, layout.startY);
      ctx.lineTo(topXCursor, layout.startY + layout.shelfH);
      ctx.moveTo(topXCursor + layout.vStreetW, layout.startY);
      ctx.lineTo(topXCursor + layout.vStreetW, layout.startY + layout.shelfH);
      ctx.moveTo(topXCursor, layout.startY + layout.shelfH);
      ctx.lineTo(topXCursor + layout.vStreetW, layout.startY + layout.shelfH);
      ctx.stroke();

      topXCursor += layout.vStreetW;
    }
  }

  for (let row = 0; row < layout.shelfRows; row += 1) {
    let xCursor = layout.startX;
    for (let block = 0; block < layout.verticalStreets + 1; block += 1) {
      for (let shelf = 0; shelf < layout.shelvesBetweenVertical; shelf += 1) {
        const y = layout.startY + layout.shelfH + layout.hStreetH + row * (layout.shelfH + layout.hStreetH);
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
    const isDeposit = isDepositCoordinate(coord);
    const isBathroom = isBathroomCoordinate(coord);
    const productLabel = Number.isFinite(coord.id) ? String(coord.id) : String(index + 1);

    ctx.beginPath();
    if (isDeposit || isBathroom) {
      ctx.rect(
        canvasPoint.x - DEPOSIT_SIZE / 2,
        canvasPoint.y - DEPOSIT_SIZE / 2,
        DEPOSIT_SIZE,
        DEPOSIT_SIZE,
      );
    } else {
      ctx.arc(canvasPoint.x, canvasPoint.y, PRODUCT_RADIUS, 0, Math.PI * 2);
    }
    ctx.fillStyle = isDeposit ? "#ea580c" : isBathroom ? "#8b5cf6" : "#0891b2";
    ctx.fill();

    ctx.strokeStyle = isDeposit ? "#c2410c" : isBathroom ? "#6d28d9" : "#e0f2fe";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(isDeposit ? "D" : isBathroom ? "B" : productLabel, canvasPoint.x, canvasPoint.y);
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

function offsetDrawableSegment(segment: DrawableSegment): { from: CanvasPoint; to: CanvasPoint } {
  const offset = segment.laneCount > 1 ? (segment.lane - (segment.laneCount - 1) / 2) * 14 : 0;

  if (segment.orientation === "horizontal") {
    return {
      from: { x: segment.from.x, y: segment.from.y + offset },
      to: { x: segment.to.x, y: segment.to.y + offset },
    };
  }

  return {
    from: { x: segment.from.x + offset, y: segment.from.y },
    to: { x: segment.to.x + offset, y: segment.to.y },
  };
}

function isSamePoint(a: CanvasPoint, b: CanvasPoint): boolean {
  return Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001;
}

function appendPoint(points: CanvasPoint[], point: CanvasPoint) {
  const lastPoint = points[points.length - 1];
  if (lastPoint && isSamePoint(lastPoint, point)) return;

  points.push(point);
}

function appendManhattanConnection(
  points: CanvasPoint[],
  from: CanvasPoint,
  to: CanvasPoint,
  cornerMode: "horizontal-first" | "vertical-first",
) {
  if (isSamePoint(from, to)) return;

  if (Math.abs(from.x - to.x) < 0.001 || Math.abs(from.y - to.y) < 0.001) {
    appendPoint(points, to);
    return;
  }

  const corner =
    cornerMode === "horizontal-first"
      ? { x: to.x, y: from.y }
      : { x: from.x, y: to.y };

  appendPoint(points, corner);
  appendPoint(points, to);
}

function getConnectionCornerMode(
  previous: OffsetDrawableSegment,
  next: OffsetDrawableSegment,
): "horizontal-first" | "vertical-first" {
  if (previous.orientation === "horizontal" && next.orientation === "vertical") {
    return "horizontal-first";
  }

  if (previous.orientation === "vertical" && next.orientation === "horizontal") {
    return "vertical-first";
  }

  return previous.orientation === "horizontal" ? "vertical-first" : "horizontal-first";
}

function getIntersectionJoin(previous: OffsetDrawableSegment, next: OffsetDrawableSegment): CanvasPoint {
  if (previous.orientation === "horizontal" && next.orientation === "vertical") {
    return { x: next.offsetFrom.x, y: previous.offsetFrom.y };
  }

  return { x: previous.offsetFrom.x, y: next.offsetFrom.y };
}

function buildOffsetRoutePoints(segments: OffsetDrawableSegment[]): CanvasPoint[] {
  const [firstSegment] = segments;
  if (!firstSegment) return [];

  const points: CanvasPoint[] = [firstSegment.offsetFrom];

  segments.forEach((segment, index) => {
    const nextSegment = segments[index + 1];
    if (!nextSegment) {
      appendPoint(points, segment.offsetTo);
      return;
    }

    if (segment.orientation !== nextSegment.orientation) {
      appendPoint(points, getIntersectionJoin(segment, nextSegment));
      return;
    }

    appendPoint(points, segment.offsetTo);

    appendManhattanConnection(
      points,
      segment.offsetTo,
      nextSegment.offsetFrom,
      getConnectionCornerMode(segment, nextSegment),
    );
  });

  return points;
}

function drawRoutePath(
  ctx: CanvasRenderingContext2D,
  points: CanvasPoint[],
  color: string,
  lineWidth: number,
) {
  const [firstPoint] = points;
  if (!firstPoint) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(firstPoint.x, firstPoint.y);

  points.slice(1).forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });

  ctx.stroke();
}

function resolveProductLabel(
  item: BackendOperarioRutaItem,
  coordinates: Coordinate[],
  fallback: number,
): string {
  if (item.codigo === "BANO") return "B";

  const byCoordinate = coordinates.find(
    (coord) =>
      !isSpecialCoordinate(coord) &&
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
      !isSpecialCoordinate(coord) &&
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

function isBathroomRouteNode(node: RouteNode): boolean {
  return node.codeCandidates.includes("BANO");
}

function isBathroomRouteMarker(marker: RouteMarkerInput): boolean {
  return marker.codeCandidates.includes("BANO");
}

function expandBathroomReturnNodes(nodes: RouteNode[]): RouteNode[] {
  const expanded: RouteNode[] = [];

  nodes.forEach((node) => {
    const previous = expanded[expanded.length - 1];
    expanded.push(node);

    if (previous && isBathroomRouteNode(node)) {
      expanded.push(previous);
    }
  });

  return expanded;
}

function expandBathroomReturnMarkers(markers: RouteMarkerInput[]): RouteMarkerInput[] {
  const expanded: RouteMarkerInput[] = [];

  markers.forEach((marker) => {
    const previous = expanded[expanded.length - 1];
    expanded.push(marker);

    if (previous && isBathroomRouteMarker(marker)) {
      expanded.push(previous);
    }
  });

  return expanded;
}

function buildRouteNodes(coordinates: Coordinate[], route: BackendOperarioRutaItem[]): RouteNode[] {
  const depositCoordinate = coordinates.find(isDepositCoordinate);
  const deposit = depositCoordinate ?? { x: 0, y: 0 };
  const depositCodeCandidates = buildDepositCodeCandidates(depositCoordinate);

  return expandBathroomReturnNodes([
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
  ]);
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
  const deposit = coordinates.find(isDepositCoordinate) ?? { x: 0, y: 0 };
  const markerInputs = expandBathroomReturnMarkers([
    {
      x: deposit.x,
      y: deposit.y,
      label: "S",
      codeCandidates: ["DEPOSITO"],
    },
    ...route.map((item, index) => ({
      x: item.x,
      y: item.y,
      label: resolveProductLabel(item, coordinates, index),
      codeCandidates: buildCodeCandidates(item, coordinates),
    })),
    {
      x: deposit.x,
      y: deposit.y,
      label: "R",
      codeCandidates: ["DEPOSITO"],
    },
  ]);

  return markerInputs.map((marker, index) => {
    const markerType: RouteMarker["markerType"] = index === 0 ? "start" : index === markerInputs.length - 1 ? "return" : "visit";

    return {
      x: marker.x,
      y: marker.y,
      label: marker.label,
      markerType,
    };
  });
}

function buildDrawableSegments(polyline: LogicalPoint[], layout: Layout): DrawableSegment[] {
  const segments: DrawableSegment[] = [];
  const groups = new Map<string, number[]>();

  for (let index = 1; index < polyline.length; index += 1) {
    const logicalFrom = polyline[index - 1];
    const logicalTo = polyline[index];
    const from = toCanvasPoint(logicalFrom, layout, "route");
    const to = toCanvasPoint(logicalTo, layout, "route");
    const sameX = Math.round(logicalFrom.x) === Math.round(logicalTo.x);
    const sameY = Math.round(logicalFrom.y) === Math.round(logicalTo.y);

    if (sameX && sameY) continue;

    const orientation = sameY ? "horizontal" : "vertical";
    const fixedAxis = orientation === "horizontal" ? Math.round(logicalFrom.y) : Math.round(logicalFrom.x);
    const rangeStart = Math.min(
      orientation === "horizontal" ? logicalFrom.x : logicalFrom.y,
      orientation === "horizontal" ? logicalTo.x : logicalTo.y,
    );
    const rangeEnd = Math.max(
      orientation === "horizontal" ? logicalFrom.x : logicalFrom.y,
      orientation === "horizontal" ? logicalTo.x : logicalTo.y,
    );
    const groupKey = `${orientation}:${fixedAxis}`;

    segments.push({
      from,
      to,
      orientation,
      rangeStart,
      rangeEnd,
      lane: 0,
      laneCount: 1,
    });

    const segmentIndex = segments.length - 1;
    const group = groups.get(groupKey) ?? [];
    group.push(segmentIndex);
    groups.set(groupKey, group);
  }

  groups.forEach((segmentIndexes) => {
    const activeLaneEnds = new Map<number, number>();
    let laneCount = 1;

    const sortedIndexes = segmentIndexes.slice().sort((a, b) => {
      const diff = segments[a].rangeStart - segments[b].rangeStart;
      return diff !== 0 ? diff : segments[a].rangeEnd - segments[b].rangeEnd;
    });

    sortedIndexes.forEach((segmentIndex) => {
      const segment = segments[segmentIndex];

      activeLaneEnds.forEach((rangeEnd, lane) => {
        if (rangeEnd <= segment.rangeStart) {
          activeLaneEnds.delete(lane);
        }
      });

      let lane = 0;
      while (activeLaneEnds.has(lane)) {
        lane += 1;
      }

      segment.lane = lane;
      activeLaneEnds.set(lane, segment.rangeEnd);
      laneCount = Math.max(laneCount, lane + 1);
    });

    segmentIndexes.forEach((segmentIndex) => {
      segments[segmentIndex].laneCount = laneCount;
    });
  });

  return segments;
}

function drawRoute(
  ctx: CanvasRenderingContext2D,
  polyline: LogicalPoint[],
  markers: RouteMarker[],
  layout: Layout,
) {
  if (polyline.length >= 2) {
    const segments = buildDrawableSegments(polyline, layout).map((segment): OffsetDrawableSegment => {
      const { from, to } = offsetDrawableSegment(segment);
      return {
        ...segment,
        offsetFrom: from,
        offsetTo: to,
      };
    });
    const routePoints = buildOffsetRoutePoints(segments);

    drawRoutePath(ctx, routePoints, "rgba(255,255,255,0.85)", 6);
    drawRoutePath(ctx, routePoints, "#dc2626", 3);

    segments.forEach((segment) => {
      drawDirectionArrow(ctx, segment.offsetFrom.x, segment.offsetFrom.y, segment.offsetTo.x, segment.offsetTo.y);
    });
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
