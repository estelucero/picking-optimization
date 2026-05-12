export interface ExperimentOrderItem {
  code: string;
  name: string;
  quantity: number;
}

export interface ExperimentOrder {
  code: string;
  customer: string;
  items: ExperimentOrderItem[];
}

export interface ExperimentAssignment {
  operator: string;
  totalTime: number;
  totalDistance: number;
  route: string[];
  orders: ExperimentOrder[];
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

const products = [
  { code: "SKU-101", name: "Lampara LED" },
  { code: "SKU-102", name: "Monitor 24" },
  { code: "SKU-103", name: "Teclado mecanico" },
  { code: "SKU-104", name: "Mouse inalambrico" },
  { code: "SKU-105", name: "Silla ergonomica" },
  { code: "SKU-106", name: "Escritorio" },
  { code: "SKU-107", name: "Auriculares" },
  { code: "SKU-108", name: "Cable USB-C" },
];

const routeNodes = ["A-01", "A-04", "B-02", "B-08", "C-03", "C-09", "D-02", "D-07", "E-01", "E-05"];

const experimentTemplates = [
  {
    id: "exp-001",
    name: "Pico de fin de mes",
    createdAt: "2026-05-10T08:30:00Z",
    status: "Completado",
    description: "Comparacion de recorridos con alta demanda y batches mixtos.",
    layout: "Deposito central - layout A",
    maxOperators: 4,
  },
  {
    id: "exp-002",
    name: "Operacion nocturna",
    createdAt: "2026-05-09T17:10:00Z",
    status: "Completado",
    description: "Escenarios con menos pedidos y rutas mas compactas.",
    layout: "Deposito anexo - layout B",
    maxOperators: 4,
  },
  {
    id: "exp-003",
    name: "Prueba de reabastecimiento",
    createdAt: "2026-05-08T11:45:00Z",
    status: "Completado",
    description: "Comparacion de asignacion frente a pedidos con mayor peso.",
    layout: "Deposito norte - layout C",
    maxOperators: 4,
  },
];

function formatNumber(value: number): number {
  return Number(value.toFixed(2));
}

function buildOrders(experimentIndex: number, operatorCount: number, runIndex: number, operatorIndex: number): ExperimentOrder[] {
  const orderCount = 2 + ((experimentIndex + operatorCount + runIndex + operatorIndex) % 3);

  return Array.from({ length: orderCount }, (_, orderIndex) => {
    const productA = products[(runIndex + orderIndex + operatorIndex) % products.length];
    const productB = products[(runIndex + orderIndex + operatorIndex + 3) % products.length];

    return {
      code: `PED-${experimentIndex + 1}${operatorCount}${runIndex + 1}-${operatorIndex + 1}${orderIndex + 1}`,
      customer: `Cliente ${experimentIndex + 1}-${operatorCount}-${runIndex + 1}-${operatorIndex + 1}-${orderIndex + 1}`,
      items: [
        { code: productA.code, name: productA.name, quantity: 1 + ((runIndex + orderIndex) % 2) },
        { code: productB.code, name: productB.name, quantity: 1 },
      ],
    };
  });
}

function buildRoute(experimentIndex: number, operatorCount: number, runIndex: number, operatorIndex: number): string[] {
  const firstNode = routeNodes[(experimentIndex + runIndex + operatorIndex) % routeNodes.length];
  const secondNode = routeNodes[(experimentIndex + operatorCount + runIndex + operatorIndex + 2) % routeNodes.length];
  const thirdNode = routeNodes[(experimentIndex + runIndex + operatorIndex + 5) % routeNodes.length];

  return ["DEPOSITO", firstNode, secondNode, thirdNode, "DEPOSITO"];
}

function buildAssignment(experimentIndex: number, operatorCount: number, runIndex: number, operatorIndex: number): ExperimentAssignment {
  const orders = buildOrders(experimentIndex, operatorCount, runIndex, operatorIndex);
  const totalItems = orders.reduce((acc, order) => acc + order.items.reduce((sum, item) => sum + item.quantity, 0), 0);
  const route = buildRoute(experimentIndex, operatorCount, runIndex, operatorIndex);
  const routeDistance = formatNumber(180 + operatorCount * 28 + runIndex * 3.5 + operatorIndex * 18 + experimentIndex * 11);
  const totalTime = formatNumber(routeDistance / (18 + operatorCount) + totalItems * 0.55);

  return {
    operator: `Operario ${operatorIndex + 1}`,
    totalTime,
    totalDistance: routeDistance,
    route,
    orders,
  };
}

function buildRuns(experimentIndex: number, operatorCount: number): ExperimentRun[] {
  return Array.from({ length: 30 }, (_, runIndex) => {
    const assignments = Array.from({ length: operatorCount }, (_, operatorIndex) =>
      buildAssignment(experimentIndex, operatorCount, runIndex, operatorIndex),
    );
    const totalTime = formatNumber(assignments.reduce((acc, assignment) => acc + assignment.totalTime, 0) + operatorCount * 0.35);
    const totalDistance = formatNumber(assignments.reduce((acc, assignment) => acc + assignment.totalDistance, 0));
    const ordersCount = assignments.reduce((acc, assignment) => acc + assignment.orders.length, 0);

    return {
      id: `run-${experimentIndex + 1}-${operatorCount}-${runIndex + 1}`,
      rank: runIndex + 1,
      label: `Run ${runIndex + 1}`,
      operatorCount,
      totalTime,
      totalDistance,
      ordersCount,
      assignments,
    };
  });
}

function buildExperiment(template: (typeof experimentTemplates)[number], experimentIndex: number): ExperimentDetail {
  const operatorGroups = Array.from({ length: template.maxOperators }, (_, index) => {
    const operatorCount = index + 1;
    return {
      operatorCount,
      runs: buildRuns(experimentIndex, operatorCount),
    };
  });

  const allRuns = operatorGroups.flatMap((group) => group.runs);
  const totalRuns = allRuns.length;
  const bestTime = Math.min(...allRuns.map((run) => run.totalTime));
  const averageTime = allRuns.reduce((acc, run) => acc + run.totalTime, 0) / totalRuns;

  return {
    id: template.id,
    name: template.name,
    createdAt: template.createdAt,
    status: template.status,
    description: template.description,
    layout: template.layout,
    maxOperators: template.maxOperators,
    totalRuns,
    bestTime: formatNumber(bestTime),
    averageTime: formatNumber(averageTime),
    operatorCounts: operatorGroups.map((group) => group.operatorCount),
    operatorGroups,
  };
}

export const experiments = experimentTemplates.map((template, index) => buildExperiment(template, index));

export function getExperiments(): ExperimentSummary[] {
  return experiments.map(({ operatorGroups, ...summary }) => summary);
}

export function getExperimentById(experimentId: string): ExperimentDetail | undefined {
  return experiments.find((experiment) => experiment.id === experimentId);
}

export function getOperatorGroup(experimentId: string, operatorCount: number): ExperimentOperatorGroup | undefined {
  return getExperimentById(experimentId)?.operatorGroups.find((group) => group.operatorCount === operatorCount);
}

export function getRunById(experimentId: string, operatorCount: number, runId: string): ExperimentRun | undefined {
  return getOperatorGroup(experimentId, operatorCount)?.runs.find((run) => run.id === runId);
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
