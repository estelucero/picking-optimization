"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ChevronRight, GitCompare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatExperimentDate,
  formatExperimentTime,
  type BackendOperario,
  type BackendExperimentoPreview,
  type BackendRunDocument,
  type BackendRunPreview,
} from "@/lib/experimentos-rest";
import {
  type BackendUbicacionDocument,
  fromBackendDocumentWithDeposit,
  type ProductMapping,
} from "@/lib/ubicaciones";
import { RoutePreviewMap } from "@/components/route-preview-map";

function formatNumber(value?: number, digits = 1): string {
  return Number.isFinite(value)
    ? Number(value).toFixed(digits)
    : digits === 2
      ? "0.00"
      : "0.0";
}

function formatRoute(
  route: {
    nombre: string;
    peso: number;
    cantidad?: number;
    codigo_pedido?: string;
  }[],
): string {
  return route
    .map(
      (item) =>
        `${item.nombre} · ${formatNumber(item.peso, 1)} kg · ${item.codigo_pedido}`,
    )
    .join(" -> ");
}

function normalizeText(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

interface BackendExperimentoDocument {
  id: string;
  experimento_preview_id: string;
  ubicacion_id: string;
  created_at?: string;
}

export default function RunDetailPage() {
  const params = useParams<{ experimentId: string; runId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const operatorCount = Number(searchParams.get("operators") || 1);
  const [experiment, setExperiment] =
    useState<BackendExperimentoPreview | null>(null);
  const [runPreview, setRunPreview] = useState<BackendRunPreview | null>(null);
  const [runLabel, setRunLabel] = useState<string | null>(null);
  const [run, setRun] = useState<BackendRunDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runPreviews, setRunPreviews] = useState<BackendRunPreview[]>([]);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedCompareOperatorCount, setSelectedCompareOperatorCount] =
    useState<number>(operatorCount);
  const [selectedCompareRun, setSelectedCompareRun] = useState<string>("");
  const [selectedRouteJourney, setSelectedRouteJourney] =
    useState<BackendOperario | null>(null);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [distribution, setDistribution] = useState<ProductMapping | null>(null);
  const [isDistributionLoading, setIsDistributionLoading] = useState(false);
  const [distributionError, setDistributionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRun() {
      setIsLoading(true);
      setError(null);

      try {
        const [experimentsResponse, runPreviewsResponse] = await Promise.all([
          fetch("/api/experimento_preview", { cache: "no-store" }),
          fetch(
            `/api/run_preview?experimento_preview_id=${params.experimentId}`,
            { cache: "no-store" },
          ),
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
        const allRunPreviews =
          (await runPreviewsResponse.json()) as BackendRunPreview[];
        const selectedIndex = allRunPreviews.findIndex(
          (item) => item.id === params.runId,
        );
        const selectedRunPreview =
          selectedIndex >= 0 ? allRunPreviews[selectedIndex] : null;
        const visibleLabel =
          selectedRunPreview &&
          selectedRunPreview.nombre.trim().toLowerCase() !== "pendiente"
            ? selectedRunPreview.nombre
            : `Run ${selectedIndex + 1}`;

        if (!preview || !selectedRunPreview) {
          throw new Error("No se encontro el run");
        }

        const runResponse = await fetch(
          `/api/run?run_preview_id=${params.runId}`,
          { cache: "no-store" },
        );
        if (!runResponse.ok) {
          throw new Error("No se pudo obtener el run");
        }

        const runs = (await runResponse.json()) as BackendRunDocument[];
        const selectedRun = runs[0] ?? null;

        if (!selectedRun) {
          throw new Error("No se encontro el run");
        }

        if (!cancelled) {
          setExperiment(preview);
          setRunPreview(selectedRunPreview);
          setRunLabel(visibleLabel);
          setRun(selectedRun);
          setRunPreviews(allRunPreviews);
        }
      } catch (loadError) {
        console.error("Error loading run detail:", loadError);
        if (!cancelled) {
          setError("No se pudo cargar el detalle del run");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRun();

    return () => {
      cancelled = true;
    };
  }, [params.experimentId, params.runId]);

  const metricas = useMemo(() => run?.metricas ?? [], [run]);
  const pedidos = useMemo(() => run?.pedidos ?? [], [run]);
  const operarios = useMemo(() => run?.operarios ?? [], [run]);
  const compareOperatorCounts = useMemo(
    () => Array.from(new Set(runPreviews.map((item) => item.operarios))).sort((a, b) => a - b),
    [runPreviews],
  );
  const compareRunOptions = useMemo(
    () =>
      runPreviews.filter(
        (rp) =>
          rp.id !== params.runId &&
          rp.operarios === selectedCompareOperatorCount,
      ),
    [params.runId, runPreviews, selectedCompareOperatorCount],
  );

  function handleCompareDialogChange(open: boolean) {
    setCompareDialogOpen(open);
    if (open) {
      setSelectedCompareOperatorCount(operatorCount);
      setSelectedCompareRun("");
    }
  }

  async function openRoutePreview(operario: BackendOperario) {
    setSelectedRouteJourney(operario);
    setIsRouteDialogOpen(true);

    if (distribution || isDistributionLoading) {
      return;
    }

    setIsDistributionLoading(true);
    setDistributionError(null);

    try {
      const experimentosResponse = await fetch("/api/experimentos", {
        cache: "no-store",
      });
      if (!experimentosResponse.ok) {
        throw new Error("No se pudieron cargar los experimentos");
      }

      const experiments =
        (await experimentosResponse.json()) as BackendExperimentoDocument[];
      const linkedExperiments = experiments.filter(
        (item) => item.experimento_preview_id === params.experimentId,
      );

      const linkedExperiment = linkedExperiments
        .slice()
        .sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        })[0];

      if (linkedExperiment?.ubicacion_id) {
        const distributionByIdResponse = await fetch(
          `/api/ubicaciones/${linkedExperiment.ubicacion_id}`,
          { cache: "no-store" },
        );

        if (distributionByIdResponse.ok) {
          const document =
            (await distributionByIdResponse.json()) as BackendUbicacionDocument;
          setDistribution(fromBackendDocumentWithDeposit(document));
          return;
        }
      }

      const response = await fetch("/api/ubicaciones", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("No se pudieron cargar las distribuciones");
      }

      if (!experiment) {
        throw new Error("No se encontro el experimento");
      }

      const documents = (await response.json()) as BackendUbicacionDocument[];
      const layoutValue = normalizeText(experiment.layout);
      const matchedDistribution = documents.find(
        (item) =>
          normalizeText(item.id) === layoutValue ||
          normalizeText(item.name) === layoutValue,
      );

      if (!matchedDistribution) {
        throw new Error("No se encontro la distribucion del layout del experimento");
      }

      setDistribution(fromBackendDocumentWithDeposit(matchedDistribution));
    } catch (routeError) {
      console.error("Error loading distribution for route preview:", routeError);
      setDistributionError("No se pudo cargar la distribucion para este run");
    } finally {
      setIsDistributionLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-blue-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">Cargando run...</p>
        </div>
      </div>
    );
  }

  if (error || !experiment || !run || !runPreview) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-blue-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">
            {error || "No se encontro el run."}
          </p>
          <Link href={`/experiments/${params.experimentId}`}>
            <Button className="mt-4">Volver al experimento</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link
            href="/experiments"
            className="hover:text-slate-900 dark:hover:text-white"
          >
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
          <span>{runLabel || runPreview.nombre}</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              {runLabel || runPreview.nombre} · {operatorCount} operarios
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Experimento {experiment.nombre} ·{" "}
              {formatExperimentDate(experiment.fecha)}
            </p>
          </div>

          <Dialog open={compareDialogOpen} onOpenChange={handleCompareDialogChange}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2 sm:w-auto">
                <GitCompare className="h-4 w-4" />
                Comparar con otro run
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Seleccionar run para comparar</DialogTitle>
                <DialogDescription>
                  Primero elegi la cantidad de operarios y despues el run
                  especifico.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Cantidad de operarios
                </p>
                <Select
                  value={String(selectedCompareOperatorCount)}
                  onValueChange={(value) => {
                    setSelectedCompareOperatorCount(Number(value));
                    setSelectedCompareRun("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona operarios" />
                  </SelectTrigger>
                  <SelectContent>
                    {compareOperatorCounts.map((count) => (
                      <SelectItem key={count} value={String(count)}>
                        {count} operarios
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Run a comparar
                </p>
                <Select
                  value={selectedCompareRun}
                  onValueChange={setSelectedCompareRun}
                  disabled={compareRunOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        compareRunOptions.length === 0
                          ? "No hay runs para ese grupo"
                          : "Selecciona un run"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {compareRunOptions.map((rp, index) => {
                      const label =
                        rp.nombre.trim().toLowerCase() !== "pendiente"
                          ? rp.nombre
                          : `Run ${index + 1}`;
                      return (
                        <SelectItem key={rp.id} value={rp.id}>
                          {label} · {formatExperimentTime(rp.tiempo)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  disabled={!selectedCompareRun}
                  onClick={() => {
                    if (selectedCompareRun) {
                      router.push(
                        `/experiments/${params.experimentId}/runs/${params.runId}/compare?with=${selectedCompareRun}&operators=${selectedCompareOperatorCount}`,
                      );
                    }
                  }}
                >
                  Comparar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-blue-100 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Metricas
          </p>
          <p className="text-sm text-slate-500">Resumen del run seleccionado</p>
        </div>
        <Table className="table-fixed">
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
              <TableCell>Tiempo total</TableCell>
              <TableCell>{formatExperimentTime(runPreview.tiempo)}</TableCell>
              <TableCell>Distancia total</TableCell>
              <TableCell>{runPreview.distancia.toFixed(2)} m</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Pedidos</TableCell>
              <TableCell>{runPreview.pedidos}</TableCell>
              <TableCell>Operarios</TableCell>
              <TableCell>{runPreview.operarios}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-blue-100 bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-white dark:border-slate-700">
          <p className="text-sm font-semibold">Pedidos</p>
          <p className="text-sm text-cyan-100">Pedidos que forman el run</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.map((pedido) => (
              <TableRow key={pedido.codigo}>
                <TableCell>{pedido.codigo}</TableCell>
                <TableCell>{pedido.cliente}</TableCell>
                <TableCell className="whitespace-normal break-words">
                  <div className="flex flex-wrap gap-2">
                    {pedido.items.map((item) => (
                      <Badge
                        key={`${pedido.codigo}-${item.codigo}`}
                        variant="secondary"
                        className="max-w-full whitespace-normal text-left"
                      >
                        {item.nombre} · {formatNumber(item.peso, 1)} kg x
                        {item.cantidad}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-blue-100 bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-3 text-white dark:border-slate-700">
          <p className="text-sm font-semibold">Operarios</p>
          <p className="text-sm text-blue-100">
            Detalle por operario con tiempos y rutas
          </p>
        </div>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Operario</TableHead>
              <TableHead>Tiempo</TableHead>
              <TableHead>Distancia</TableHead>
              <TableHead>Capacidad carro</TableHead>
              <TableHead>Ruta</TableHead>
              <TableHead>Accion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operarios.map((operario) => (
              <TableRow
                key={`${operario.nombre}-${operario.tiempo}-${operario.distancia}`}
              >
                <TableCell>{operario.nombre}</TableCell>
                <TableCell>{formatExperimentTime(operario.tiempo)}</TableCell>
                <TableCell>{formatNumber(operario.distancia, 2)} m</TableCell>
                <TableCell>
                  {operario.capacidad_max_peso
                    ? `${formatNumber(operario.capacidad_max_peso, 1)} kg`
                    : "N/D"}
                </TableCell>
                <TableCell className="max-w-[420px] whitespace-normal break-words">
                  {formatRoute(operario.ruta)}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openRoutePreview(operario)}
                  >
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
        <DialogContent className="!w-[94vw] !max-w-[1320px] h-[88vh] overflow-hidden p-4">
          <DialogHeader>
            <DialogTitle>Ruta del operario</DialogTitle>
            <DialogDescription>
              Visualizacion del recorrido sobre el layout de distribucion,
              usando los caminos calculados entre productos y deposito.
            </DialogDescription>
          </DialogHeader>

          {selectedRouteJourney && (
            <div className="space-y-3">
              <div className="rounded-xl border border-blue-100 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <p>
                  {selectedRouteJourney.nombre} · {formatExperimentTime(selectedRouteJourney.tiempo)} · {formatNumber(selectedRouteJourney.distancia, 2)} m
                </p>
              </div>

              {isDistributionLoading ? (
                <p className="text-sm text-slate-500">Cargando distribucion...</p>
              ) : distributionError ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {distributionError}
                </p>
              ) : selectedRouteJourney.ruta.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay puntos de ruta para este viaje.
                </p>
              ) : distribution ? (
                <RoutePreviewMap
                  coordinates={distribution.coordinates}
                  route={selectedRouteJourney.ruta}
                  caminos={distribution.caminos}
                  layoutConfig={{
                    numAisles: distribution.callesVerticales,
                    numRows: distribution.callesHorizontales,
                    shelvesBetweenStreets: distribution.estanteriasPorCalle,
                  }}
                />
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {metricas.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-blue-100 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Metricas extra
            </p>
            <p className="text-sm text-slate-500">
              Valores devueltos por el backend
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metrica</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricas.map((metrica) => (
                <TableRow key={metrica.nombre}>
                  <TableCell>{metrica.nombre}</TableCell>
                  <TableCell>{metrica.valor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
