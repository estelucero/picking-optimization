"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SimulationChart } from "@/components/simulation-chart";
import {
  buildExperimentDetail,
  formatExperimentDate,
  formatExperimentTime,
  type BackendExperimentoPreview,
  type BackendRunPreview,
  type ExperimentDetail,
  type ExperimentRun,
} from "@/lib/experimentos-rest";

interface ExperimentChartResult {
  operarios: number;
  tiempo: number;
  tiempo_promedio_por_operario?: Record<string, number>;
}

interface StoredExperimentResult {
  resultados?: ExperimentChartResult[];
}

interface StoredExperiment {
  id: string;
  experimento_preview_id?: string;
  created_at?: string;
  resultado?: StoredExperimentResult;
}

function getBestRun(runs: ExperimentRun[]): ExperimentRun {
  return runs.reduce((best, run) => (run.totalTime < best.totalTime ? run : best), runs[0]);
}

function getWorstRun(runs: ExperimentRun[]): ExperimentRun {
  return runs.reduce((worst, run) => (run.totalTime > worst.totalTime ? run : worst), runs[0]);
}

export default function ExperimentDetailPage() {
  const params = useParams<{ experimentId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [experiment, setExperiment] = useState<ExperimentDetail | null>(null);
  const [runQuery, setRunQuery] = useState("");
  const [runSort, setRunSort] = useState("time-asc");
  const [linkedChartData, setLinkedChartData] = useState<ExperimentChartResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExperiment() {
      setIsLoading(true);
      setError(null);

      try {
        const [experimentsResponse, runPreviewsResponse, storedExperimentsResponse] = await Promise.all([
          fetch("/api/experimento_preview", { cache: "no-store" }),
          fetch(`/api/run_preview?experimento_preview_id=${params.experimentId}`, { cache: "no-store" }),
          fetch("/api/experimentos", { cache: "no-store" }),
        ]);

        if (!experimentsResponse.ok) {
          throw new Error("No se pudo obtener el experimento");
        }

        if (!runPreviewsResponse.ok) {
          throw new Error("No se pudieron obtener los run previews");
        }

        if (!storedExperimentsResponse.ok) {
          throw new Error("No se pudieron obtener los experimentos guardados");
        }

        const previews = (await experimentsResponse.json()) as BackendExperimentoPreview[];
        const preview = previews.find((item) => item.id === params.experimentId);
        const runPreviews = (await runPreviewsResponse.json()) as BackendRunPreview[];
        const storedExperiments = (await storedExperimentsResponse.json()) as StoredExperiment[];

        if (!preview) {
          throw new Error("No se encontro el experimento");
        }

        if (!cancelled) {
          setExperiment(buildExperimentDetail(preview, runPreviews));

          const linkedExperiment = storedExperiments
            .filter((item) => item.experimento_preview_id === params.experimentId)
            .sort((a, b) => {
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA;
            })[0];

          setLinkedChartData(linkedExperiment?.resultado?.resultados ?? []);
        }
      } catch (loadError) {
        console.error("Error loading experiment detail:", loadError);
        if (!cancelled) {
          setError("No se pudo cargar el detalle del experimento");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadExperiment();

    return () => {
      cancelled = true;
    };
  }, [params.experimentId]);

  const fallbackOperatorCount = experiment?.operatorCounts[0] || 1;
  const selectedOperatorCount = Number(searchParams.get("operators") || fallbackOperatorCount);
  const resolvedOperatorCount = Number.isFinite(selectedOperatorCount) ? selectedOperatorCount : fallbackOperatorCount;
  const selectedGroup = experiment?.operatorGroups.find((group) => group.operatorCount === resolvedOperatorCount) || experiment?.operatorGroups[0];

  const chartData = useMemo(
    () =>
      linkedChartData.length > 0
        ? linkedChartData
        : experiment?.operatorGroups.map((group) => ({
            operarios: group.operatorCount,
            tiempo: Number((group.runs.reduce((acc, run) => acc + run.totalTime, 0) / group.runs.length).toFixed(2)),
          })) ?? [],
    [experiment, linkedChartData],
  );

  const filteredRuns = useMemo(() => {
    const normalizedQuery = runQuery.trim().toLowerCase();
    const runs = selectedGroup?.runs ?? [];

    return [...runs]
      .filter((run) => normalizedQuery.length === 0 || run.label.toLowerCase().includes(normalizedQuery) || run.id.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => {
        if (runSort === "time-desc") return b.totalTime - a.totalTime;
        if (runSort === "distance-asc") return a.totalDistance - b.totalDistance;
        if (runSort === "distance-desc") return b.totalDistance - a.totalDistance;
        return a.totalTime - b.totalTime;
      });
  }, [runQuery, runSort, selectedGroup]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-blue-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">Cargando experimento...</p>
        </div>
      </div>
    );
  }

  if (error || !experiment || !selectedGroup) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-blue-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">{error || "No se encontro el experimento."}</p>
          <Link href="/experiments">
            <Button className="mt-4">Volver</Button>
          </Link>
        </div>
      </div>
    );
  }

  const bestRun = getBestRun(selectedGroup.runs);
  const worstRun = getWorstRun(selectedGroup.runs);
  const averageRunTime = selectedGroup.runs.reduce((acc, run) => acc + run.totalTime, 0) / selectedGroup.runs.length;

  return (
    <div className="p-8 space-y-6">
      <div className="sticky top-20 z-20 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 via-cyan-50 to-white p-5 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/experiments" className="hover:text-slate-900 dark:hover:text-white">
              Experimentos
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>{experiment.name}</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{experiment.name}</h1>
          <p className="max-w-3xl text-slate-600 dark:text-slate-400">{experiment.description}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-blue-100 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Metricas</p>
          <p className="text-sm text-slate-500">Resumen del grupo seleccionado</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metrica</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Metrica</TableHead>
              <TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Operarios seleccionados</TableCell>
              <TableCell>{selectedGroup.operatorCount}</TableCell>
              <TableCell>Runs en el grupo</TableCell>
              <TableCell>{selectedGroup.runs.length}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Mejor run</TableCell>
              <TableCell>{formatExperimentTime(bestRun.totalTime)}</TableCell>
              <TableCell>Promedio</TableCell>
              <TableCell>{formatExperimentTime(averageRunTime)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Peor run</TableCell>
              <TableCell>{formatExperimentTime(worstRun.totalTime)}</TableCell>
              <TableCell>Layout</TableCell>
              <TableCell>{experiment.layout}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-blue-100 bg-white px-5 py-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Grafico</p>
          <p className="text-sm text-slate-500">Tiempo promedio vs cantidad de operarios</p>
        </div>
        <div className="p-4">
          <SimulationChart
            data={chartData}
            isLoading={false}
            xAxisLabel="Operarios"
            yAxisLabel="Tiempo promedio (minutos)"
            barName="Tiempo promedio"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Filtrar operarios</p>
            <p className="text-sm text-slate-500">Elegí la cantidad y mirá sus runs</p>
          </div>
          <Select value={String(resolvedOperatorCount)} onValueChange={(value) => router.push(`/experiments/${experiment.id}?operators=${value}`)}>
            <SelectTrigger className="w-full sm:w-[180px] border-blue-200 bg-white dark:border-slate-600 dark:bg-slate-950">
              <SelectValue placeholder="Operarios" />
            </SelectTrigger>
            <SelectContent>
              {experiment.operatorCounts.map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count} operarios
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-blue-100 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Runs</p>
          <p className="text-sm text-slate-500">Filtrá y abrí cualquier corrida</p>
        </div>
        <div className="grid grid-cols-1 gap-3 border-b border-blue-100 p-4 dark:border-slate-700 lg:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={runQuery} onChange={(event) => setRunQuery(event.target.value)} placeholder="Buscar run por nombre o id" className="pl-9" />
          </div>
          <Select value={runSort} onValueChange={setRunSort}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Orden" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time-asc">Tiempo ascendente</SelectItem>
              <SelectItem value="time-desc">Tiempo descendente</SelectItem>
              <SelectItem value="distance-asc">Distancia ascendente</SelectItem>
              <SelectItem value="distance-desc">Distancia descendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Run</TableHead>
              <TableHead>Tiempo</TableHead>
              <TableHead>Distancia</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead>Operarios</TableHead>
              <TableHead>Accion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRuns.map((run) => (
              <TableRow key={run.id}>
                <TableCell>
                  <div className="font-medium text-slate-900 dark:text-white">{run.label}</div>
                  <div className="text-xs text-slate-500">{run.id}</div>
                </TableCell>
                <TableCell>{formatExperimentTime(run.totalTime)}</TableCell>
                <TableCell>{run.totalDistance.toFixed(2)} m</TableCell>
                <TableCell>{run.ordersCount}</TableCell>
                <TableCell>{run.operatorCount}</TableCell>
                <TableCell>
                  <Link href={`/experiments/${experiment.id}/runs/${run.id}?operators=${selectedGroup.operatorCount}`}>
                    <Button size="sm" variant="outline" className="gap-2">
                      Ver run
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {filteredRuns.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                  No hay runs que coincidan con el filtro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
