export interface BackendExperimentoPreview {
  id: string;
  nombre: string;
  fecha: string;
  layout: string;
  max_operarios: number;
  runs: number;
  estado: string;
}

export interface BackendRunPreview {
  id: string;
  experimento_preview_id: string;
  nombre: string;
  tiempo: number;
  distancia: number;
  pedidos: number;
  operarios: number;
}

export interface BackendPedidoItem {
  codigo: string;
  nombre: string;
  peso: number;
  x: number;
  y: number;
  cantidad: number;
}

export interface BackendPedido {
  codigo: string;
  cliente: string;
  items: BackendPedidoItem[];
}

export interface BackendOperarioRutaItem {
  codigo: string;
  nombre: string;
  peso: number;
  x: number;
  y: number;
  cantidad?: number;
}

export interface BackendOperario {
  nombre: string;
  tiempo: number;
  distancia: number;
  capacidad_max_peso?: number;
  ruta: BackendOperarioRutaItem[];
}

export interface BackendMetrica {
  nombre: string;
  valor: number;
}

export interface BackendRunDocument {
  id: string;
  run_preview_id: string;
  pedidos: BackendPedido[];
  metricas: BackendMetrica[];
  operarios: BackendOperario[];
}

export interface ExperimentAssignment {
  operator: string;
  totalTime: number;
  totalDistance: number;
  route: string[];
}

export interface ExperimentRun {
  id: string;
  rank: number;
  label: string;
  operatorCount: number;
  totalTime: number;
  totalDistance: number;
  ordersCount: number;
  assignments: ExperimentAssignment[];
}

export interface ExperimentOperatorGroup {
  operatorCount: number;
  runs: ExperimentRun[];
}

export interface ExperimentSummary {
  id: string;
  name: string;
  createdAt: string;
  status: string;
  description: string;
  layout: string;
  maxOperators: number;
  totalRuns: number;
  bestTime: number;
  averageTime: number;
  operatorCounts: number[];
}

export interface ExperimentDetail extends ExperimentSummary {
  operatorGroups: ExperimentOperatorGroup[];
}

function groupRunPreviewsByExperiment(runPreviews: BackendRunPreview[]): Map<string, BackendRunPreview[]> {
  return runPreviews.reduce((acc, runPreview) => {
    const current = acc.get(runPreview.experimento_preview_id) ?? [];
    current.push(runPreview);
    acc.set(runPreview.experimento_preview_id, current);
    return acc;
  }, new Map<string, BackendRunPreview[]>());
}

function normalizeLabel(label: string | undefined, index: number): string {
  const trimmed = label?.trim();
  if (!trimmed || trimmed.toLowerCase() === "pendiente") {
    return `Run ${index + 1}`;
  }

  return trimmed;
}

function buildAssignment(operario: BackendOperario): ExperimentAssignment {
  return {
    operator: operario.nombre,
    totalTime: operario.tiempo,
    totalDistance: operario.distancia,
    route: operario.ruta.map((item) => item.codigo || item.nombre),
  };
}

export function buildExperimentSummaries(
  previews: BackendExperimentoPreview[],
  runPreviews: BackendRunPreview[],
): ExperimentSummary[] {
  const groupedRunPreviews = groupRunPreviewsByExperiment(runPreviews);

  return previews.map((preview) => {
    const runs = groupedRunPreviews.get(preview.id) ?? [];
    const times = runs.map((run) => run.tiempo);
    const operatorCounts = Array.from(new Set(runs.map((run) => run.operarios))).sort((a, b) => a - b);

    return {
      id: preview.id,
      name: preview.nombre,
      createdAt: preview.fecha,
      status: preview.estado,
      description: `Layout ${preview.layout} · ${preview.runs} iteraciones`,
      layout: preview.layout,
      maxOperators: preview.max_operarios,
      totalRuns: runs.length,
      bestTime: times.length > 0 ? Math.min(...times) : 0,
      averageTime: times.length > 0 ? times.reduce((acc, time) => acc + time, 0) / times.length : 0,
      operatorCounts,
    };
  });
}

export function buildExperimentDetail(
  preview: BackendExperimentoPreview,
  runPreviews: BackendRunPreview[],
): ExperimentDetail {
  const operatorGroups = Array.from(new Set(runPreviews.map((run) => run.operarios)))
    .sort((a, b) => a - b)
    .map((operatorCount) => ({
      operatorCount,
      runs: runPreviews
        .filter((run) => run.operarios === operatorCount)
        .map((run, index) => ({
          id: run.id,
          rank: index + 1,
          label: normalizeLabel(run.nombre, index),
          operatorCount: run.operarios,
          totalTime: run.tiempo,
          totalDistance: run.distancia,
          ordersCount: run.pedidos,
          assignments: [],
        })),
    }));

  const allRuns = operatorGroups.flatMap((group) => group.runs);
  const bestTime = allRuns.length > 0 ? Math.min(...allRuns.map((run) => run.totalTime)) : 0;
  const averageTime =
    allRuns.length > 0 ? allRuns.reduce((acc, run) => acc + run.totalTime, 0) / allRuns.length : 0;

  return {
    id: preview.id,
    name: preview.nombre,
    createdAt: preview.fecha,
    status: preview.estado,
    description: `Layout ${preview.layout} · ${preview.runs} iteraciones`,
    layout: preview.layout,
    maxOperators: preview.max_operarios,
    totalRuns: allRuns.length,
    bestTime,
    averageTime,
    operatorCounts: operatorGroups.map((group) => group.operatorCount),
    operatorGroups,
  };
}

export function buildRunDetail(run: BackendRunDocument): ExperimentRun {
  const firstMetric = run.metricas.find((metric) => metric.nombre === "Tiempo total");

  return {
    id: run.id,
    rank: 1,
    label: firstMetric ? "Run" : "Run",
    operatorCount: run.operarios.length,
    totalTime: firstMetric?.valor ?? 0,
    totalDistance: run.metricas.find((metric) => metric.nombre === "Distancia total")?.valor ?? 0,
    ordersCount: run.metricas.find((metric) => metric.nombre === "Pedidos")?.valor ?? run.pedidos.length,
    assignments: run.operarios.map(buildAssignment),
  };
}

export function formatExperimentDate(date: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatExperimentTime(value: number): string {
  return `${value.toFixed(2)} min`;
}
