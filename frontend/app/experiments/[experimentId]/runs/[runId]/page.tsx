"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";

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
  formatExperimentDate,
  formatExperimentTime,
  type BackendExperimentoPreview,
  type BackendRunDocument,
  type BackendRunPreview,
} from "@/lib/experimentos-rest";

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

export default function RunDetailPage() {
  const params = useParams<{ experimentId: string; runId: string }>();
  const searchParams = useSearchParams();

  const operatorCount = Number(searchParams.get("operators") || 1);
  const [experiment, setExperiment] =
    useState<BackendExperimentoPreview | null>(null);
  const [runPreview, setRunPreview] = useState<BackendRunPreview | null>(null);
  const [runLabel, setRunLabel] = useState<string | null>(null);
  const [run, setRun] = useState<BackendRunDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const runPreviews =
          (await runPreviewsResponse.json()) as BackendRunPreview[];
        const selectedIndex = runPreviews.findIndex(
          (item) => item.id === params.runId,
        );
        const selectedRunPreview =
          selectedIndex >= 0 ? runPreviews[selectedIndex] : null;
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
        <div className="flex items-center gap-2 text-sm text-slate-500">
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
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          {runLabel || runPreview.nombre} · {operatorCount} operarios
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Experimento {experiment.nombre} ·{" "}
          {formatExperimentDate(experiment.fecha)}
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-blue-100 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Metricas
          </p>
          <p className="text-sm text-slate-500">Resumen del run seleccionado</p>
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
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {pedido.items.map((item) => (
                      <Badge
                        key={`${pedido.codigo}-${item.codigo}`}
                        variant="secondary"
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Operario</TableHead>
              <TableHead>Tiempo</TableHead>
              <TableHead>Distancia</TableHead>
              <TableHead>Capacidad carro</TableHead>
              <TableHead>Ruta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operarios.map((operario) => (
              <TableRow key={operario.nombre}>
                <TableCell>{operario.nombre}</TableCell>
                <TableCell>{formatExperimentTime(operario.tiempo)}</TableCell>
                <TableCell>{formatNumber(operario.distancia, 2)} m</TableCell>
                <TableCell>
                  {operario.capacidad_max_peso
                    ? `${formatNumber(operario.capacidad_max_peso, 1)} kg`
                    : "N/D"}
                </TableCell>
                <TableCell>{formatRoute(operario.ruta)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
