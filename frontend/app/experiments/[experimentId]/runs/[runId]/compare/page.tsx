"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronRight, Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatExperimentTime,
  type BackendExperimentoPreview,
  type BackendRunDocument,
  type BackendRunPreview,
} from "@/lib/experimentos-rest";

type RouteItem = {
  nombre: string;
  peso: number;
  cantidad?: number;
  codigo_pedido?: string;
};

type OperatorSummary = {
  nombre: string;
  tiempoTotal: number;
  distanciaTotal: number;
  viajes: number;
};

type JourneyDetail = {
  nombre: string;
  tiempo: number;
  distancia: number;
  ruta: RouteItem[];
};

function formatNumber(value?: number, digits = 1): string {
  return Number.isFinite(value)
    ? Number(value).toFixed(digits)
    : digits === 2
      ? "0.00"
      : "0.0";
}

function formatRoute(route: RouteItem[]): string {
  return route
    .map(
      (item) =>
        `${item.nombre} · ${formatNumber(item.peso, 1)} kg · ${item.codigo_pedido}`,
    )
    .join(" -> ");
}

function normalizeRunLabel(label: string | undefined, index: number): string {
  const trimmed = label?.trim();
  if (!trimmed || trimmed.toLowerCase() === "pendiente") {
    return `Run ${index + 1}`;
  }

  return trimmed;
}

function getMetricValue(run: BackendRunDocument | null, name: string): number {
  if (!run) return 0;
  const metric = run.metricas.find((item) => item.nombre === name);
  return metric?.valor ?? 0;
}

function getMinOperatorTime(run: BackendRunDocument | null): number {
  if (!run || run.operarios.length === 0) return 0;
  return Math.min(...run.operarios.map((operario) => operario.tiempo));
}

function getAverageOperatorTime(run: BackendRunDocument | null): number {
  if (!run || run.operarios.length === 0) return 0;
  return (
    run.operarios.reduce((acc, operario) => acc + operario.tiempo, 0) /
    run.operarios.length
  );
}

function getTotalDistance(run: BackendRunDocument | null): number {
  const metricDistance = getMetricValue(run, "Distancia total");
  if (metricDistance > 0) return metricDistance;
  if (!run) return 0;

  return run.operarios.reduce((acc, operario) => acc + operario.distancia, 0);
}

function getOperatorSummaries(run: BackendRunDocument | null): OperatorSummary[] {
  if (!run) return [];

  const summaries = new Map<string, OperatorSummary>();

  for (const operario of run.operarios) {
    const current = summaries.get(operario.nombre) ?? {
      nombre: operario.nombre,
      tiempoTotal: 0,
      distanciaTotal: 0,
      viajes: 0,
    };

    current.tiempoTotal += operario.tiempo;
    current.distanciaTotal += operario.distancia;
    current.viajes += 1;
    summaries.set(operario.nombre, current);
  }

  return Array.from(summaries.values());
}

function getJourneyDetails(run: BackendRunDocument | null): JourneyDetail[] {
  if (!run) return [];

  return run.operarios.map((operario) => ({
    nombre: operario.nombre,
    tiempo: operario.tiempo,
    distancia: operario.distancia,
    ruta: operario.ruta,
  }));
}

function DiffIndicator({
  diff,
  lowerIsBetter = true,
}: {
  diff: number;
  lowerIsBetter?: boolean;
}) {
  const absDiff = Math.abs(diff);
  const isBetter = lowerIsBetter ? diff < 0 : diff > 0;

  if (Math.abs(diff) < 0.001) {
    return (
      <span className="flex items-center gap-1 text-slate-500">
        <Minus className="h-3 w-3" />
        Igual
      </span>
    );
  }

  if (isBetter) {
    return (
      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
        <TrendingDown className="h-3 w-3" />
        -{absDiff.toFixed(2)}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
      <TrendingUp className="h-3 w-3" />
      +{absDiff.toFixed(2)}
    </span>
  );
}

function DiffPercent({
  valueA,
  valueB,
  lowerIsBetter = true,
}: {
  valueA: number;
  valueB: number;
  lowerIsBetter?: boolean;
}) {
  if (valueA === 0) return null;

  const percent = ((valueB - valueA) / valueA) * 100;
  const absPercent = Math.abs(percent);
  const isBetter = lowerIsBetter ? percent < 0 : percent > 0;

  if (absPercent < 0.01) {
    return <span className="text-slate-500">0.00%</span>;
  }

  if (isBetter) {
    return (
      <span className="text-green-600 dark:text-green-400">
        -{absPercent.toFixed(1)}%
      </span>
    );
  }

  return (
    <span className="text-red-600 dark:text-red-400">
      +{absPercent.toFixed(1)}%
    </span>
  );
}

function formatOrderItems(
  items: {
    codigo: string;
    nombre: string;
    peso: number;
    cantidad: number;
  }[],
) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge
          key={item.codigo}
          variant="secondary"
          className="max-w-full whitespace-normal text-left"
        >
          {item.nombre} · {formatNumber(item.peso, 1)} kg x{item.cantidad}
        </Badge>
      ))}
    </div>
  );
}

function RunOrdersCard({
  title,
  run,
}: {
  title: string;
  run: BackendRunDocument;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-blue-100 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-sm text-slate-500">Pila de pedidos del run</p>
      </div>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Items</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {run.pedidos.map((pedido) => (
            <TableRow key={pedido.codigo}>
              <TableCell>{pedido.codigo}</TableCell>
              <TableCell>{pedido.cliente}</TableCell>
              <TableCell className="whitespace-normal break-words">
                {formatOrderItems(pedido.items)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RunOperatorSummaryCard({
  title,
  run,
}: {
  title: string;
  run: BackendRunDocument;
}) {
  const summaries = getOperatorSummaries(run);

  return (
    <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-blue-100 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-sm text-slate-500">Tiempo total y distancia acumulada por operario</p>
      </div>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead>Operario</TableHead>
            <TableHead>Tiempo total</TableHead>
            <TableHead>Distancia total</TableHead>
            <TableHead>Viajes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summaries.map((summary) => (
            <TableRow key={summary.nombre}>
              <TableCell>{summary.nombre}</TableCell>
              <TableCell>{formatExperimentTime(summary.tiempoTotal)}</TableCell>
              <TableCell>{formatNumber(summary.distanciaTotal, 2)} m</TableCell>
              <TableCell>{summary.viajes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RunJourneyCard({
  title,
  run,
}: {
  title: string;
  run: BackendRunDocument;
}) {
  const journeys = getJourneyDetails(run);

  return (
    <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-blue-100 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-sm text-slate-500">Recorrido, distancia y tiempo de cada viaje</p>
      </div>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead>Operario</TableHead>
            <TableHead>Recorrido</TableHead>
            <TableHead>Distancia</TableHead>
            <TableHead>Tiempo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {journeys.map((journey, index) => (
            <TableRow key={`${journey.nombre}-${index}`}>
              <TableCell>{journey.nombre}</TableCell>
              <TableCell className="whitespace-normal break-words">
                {journey.ruta.length > 0 ? formatRoute(journey.ruta) : "N/A"}
              </TableCell>
              <TableCell>{formatNumber(journey.distancia, 2)} m</TableCell>
              <TableCell>{formatExperimentTime(journey.tiempo)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function RunComparePage() {
  const params = useParams<{ experimentId: string; runId: string }>();
  const searchParams = useSearchParams();
  const run2Id = searchParams.get("with");

  const operatorCount = Number(searchParams.get("operators") || 1);
  const [experiment, setExperiment] =
    useState<BackendExperimentoPreview | null>(null);
  const [run1Label, setRun1Label] = useState<string>("");
  const [run2Label, setRun2Label] = useState<string>("");
  const [run1, setRun1] = useState<BackendRunDocument | null>(null);
  const [run2, setRun2] = useState<BackendRunDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRuns() {
      if (!run2Id) {
        setError("No se selecciono un segundo run para comparar");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [experimentsResponse, runPreviewsResponse] = await Promise.all([
          fetch("/api/experimento_preview", { cache: "no-store" }),
          fetch(`/api/run_preview?experimento_preview_id=${params.experimentId}`, {
            cache: "no-store",
          }),
        ]);

        if (!experimentsResponse.ok) {
          throw new Error("No se pudo obtener el experimento");
        }

        if (!runPreviewsResponse.ok) {
          throw new Error("No se pudieron obtener los run previews");
        }

        const previews =
          (await experimentsResponse.json()) as BackendExperimentoPreview[];
        const preview =
          previews.find((item) => item.id === params.experimentId) ?? null;
        const runPreviews =
          (await runPreviewsResponse.json()) as BackendRunPreview[];

        const run1Preview = runPreviews.find((item) => item.id === params.runId);
        const run2Preview = runPreviews.find((item) => item.id === run2Id);

        if (!preview || !run1Preview || !run2Preview) {
          throw new Error("No se encontraron los runs para comparar");
        }

        const run1LabelValue = normalizeRunLabel(
          run1Preview.nombre,
          runPreviews.findIndex((item) => item.id === params.runId),
        );
        const run2LabelValue = normalizeRunLabel(
          run2Preview.nombre,
          runPreviews.findIndex((item) => item.id === run2Id),
        );

        const [run1Response, run2Response] = await Promise.all([
          fetch(`/api/run?run_preview_id=${params.runId}`, { cache: "no-store" }),
          fetch(`/api/run?run_preview_id=${run2Id}`, { cache: "no-store" }),
        ]);

        if (!run1Response.ok || !run2Response.ok) {
          throw new Error("No se pudieron obtener los datos de los runs");
        }

        const runs1 = (await run1Response.json()) as BackendRunDocument[];
        const runs2 = (await run2Response.json()) as BackendRunDocument[];

        const selectedRun1 = runs1[0] ?? null;
        const selectedRun2 = runs2[0] ?? null;

        if (!selectedRun1 || !selectedRun2) {
          throw new Error("No se encontraron los datos de los runs");
        }

        if (!cancelled) {
          setExperiment(preview);
          setRun1Label(run1LabelValue);
          setRun2Label(run2LabelValue);
          setRun1(selectedRun1);
          setRun2(selectedRun2);
        }
      } catch (loadError) {
        console.error("Error loading runs for comparison:", loadError);
        if (!cancelled) {
          setError("No se pudo cargar la comparacion de runs");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRuns();

    return () => {
      cancelled = true;
    };
  }, [params.experimentId, params.runId, run2Id]);

  const minTime1 = useMemo(() => getMinOperatorTime(run1), [run1]);
  const minTime2 = useMemo(() => getMinOperatorTime(run2), [run2]);
  const avgTime1 = useMemo(() => getAverageOperatorTime(run1), [run1]);
  const avgTime2 = useMemo(() => getAverageOperatorTime(run2), [run2]);
  const distance1 = useMemo(() => getTotalDistance(run1), [run1]);
  const distance2 = useMemo(() => getTotalDistance(run2), [run2]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-blue-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">Cargando comparacion...</p>
        </div>
      </div>
    );
  }

  if (error || !experiment || !run1 || !run2) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-blue-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">
            {error || "No se encontraron los runs para comparar."}
          </p>
          <Link href={`/experiments/${params.experimentId}`}>
            <Button className="mt-4">Volver al experimento</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/experiments" className="hover:text-slate-900 dark:hover:text-white">
            Experimentos
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href={`/experiments/${experiment.id}?operators=${operatorCount}`}
            className="hover:text-slate-900 dark:hover:text-white"
          >
            {experiment.nombre}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>Comparacion de runs</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {run1Label} vs {run2Label}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Bloques separados por run para comparar y revisar cada detalle
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-blue-100 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Comparativa global
          </p>
          <p className="text-sm text-slate-500">
            Tiempo minimo, distancia recorrida y tiempo promedio por operario
          </p>
        </div>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Metrica</TableHead>
              <TableHead>{run1Label}</TableHead>
              <TableHead>{run2Label}</TableHead>
              <TableHead>Diferencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Tiempo minimo</TableCell>
              <TableCell>{formatExperimentTime(minTime1)}</TableCell>
              <TableCell>{formatExperimentTime(minTime2)}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <DiffIndicator diff={minTime2 - minTime1} />
                  <DiffPercent valueA={minTime1} valueB={minTime2} />
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Distancia recorrida</TableCell>
              <TableCell>{formatNumber(distance1, 2)} m</TableCell>
              <TableCell>{formatNumber(distance2, 2)} m</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <DiffIndicator diff={distance2 - distance1} />
                  <DiffPercent valueA={distance1} valueB={distance2} />
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Tiempo promedio operario</TableCell>
              <TableCell>{formatExperimentTime(avgTime1)}</TableCell>
              <TableCell>{formatExperimentTime(avgTime2)}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <DiffIndicator diff={avgTime2 - avgTime1} />
                  <DiffPercent valueA={avgTime1} valueB={avgTime2} />
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RunOrdersCard title={run1Label} run={run1} />
        <RunOrdersCard title={run2Label} run={run2} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RunOperatorSummaryCard title={run1Label} run={run1} />
        <RunOperatorSummaryCard title={run2Label} run={run2} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RunJourneyCard title={run1Label} run={run1} />
        <RunJourneyCard title={run2Label} run={run2} />
      </div>
    </div>
  );
}
