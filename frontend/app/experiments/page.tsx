"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  buildExperimentSummaries,
  formatExperimentDate,
  formatExperimentTime,
  type BackendExperimentoPreview,
  type BackendRunPreview,
  type ExperimentSummary,
} from "@/lib/experimentos-rest";

export default function ExperimentsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [operatorFilter, setOperatorFilter] = useState("Todos");
  const [experiments, setExperiments] = useState<ExperimentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExperiments() {
      setIsLoading(true);
      setError(null);

      try {
        const [experimentsResponse, runPreviewsResponse] = await Promise.all([
          fetch("/api/experimento_preview", { cache: "no-store" }),
          fetch("/api/run_preview", { cache: "no-store" }),
        ]);

        if (!experimentsResponse.ok) {
          throw new Error("No se pudieron obtener los experimentos");
        }

        if (!runPreviewsResponse.ok) {
          throw new Error("No se pudieron obtener los run previews");
        }

        const previews = (await experimentsResponse.json()) as BackendExperimentoPreview[];
        const runPreviews = (await runPreviewsResponse.json()) as BackendRunPreview[];

        if (!cancelled) {
          setExperiments(buildExperimentSummaries(previews, runPreviews));
        }
      } catch (loadError) {
        console.error("Error loading experiments:", loadError);
        if (!cancelled) {
          setError("No se pudo cargar el historial de experimentos");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadExperiments();

    return () => {
      cancelled = true;
    };
  }, []);

  const statusOptions = useMemo(() => ["Todos", ...new Set(experiments.map((experiment) => experiment.status))], [experiments]);
  const operatorOptions = useMemo(
    () => ["Todos", ...new Set(experiments.flatMap((experiment) => experiment.operatorCounts))].sort((a, b) => {
      if (a === "Todos") return -1;
      if (b === "Todos") return 1;
      return Number(a) - Number(b);
    }),
    [experiments],
  );

  const filteredExperiments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return experiments.filter((experiment) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        experiment.name.toLowerCase().includes(normalizedQuery) ||
        experiment.layout.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "Todos" || experiment.status === status;
      const matchesOperators = operatorFilter === "Todos" || experiment.operatorCounts.includes(Number(operatorFilter));

      return matchesQuery && matchesStatus && matchesOperators;
    });
  }, [experiments, operatorFilter, query, status]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Experimentos corridos</h1>
        <p className="max-w-2xl text-slate-600 dark:text-slate-400">
          Tabla de historial para filtrar y abrir experimentos, grupos por operarios y runs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-blue-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o layout"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={operatorFilter} onValueChange={setOperatorFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Operarios" />
          </SelectTrigger>
          <SelectContent>
            {operatorOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Experimento</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Layout</TableHead>
              <TableHead>Max operarios</TableHead>
              <TableHead>Runs</TableHead>
              <TableHead>Mejor tiempo</TableHead>
              <TableHead>Promedio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Accion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                  Cargando historial...
                </TableCell>
              </TableRow>
            )}
            {error && !isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            )}
            {filteredExperiments.map((experiment) => (
              <TableRow key={experiment.id}>
                <TableCell>
                  <div className="font-medium text-slate-900 dark:text-white">{experiment.name}</div>
                  <div className="text-xs text-slate-500">{experiment.id}</div>
                </TableCell>
                <TableCell>{formatExperimentDate(experiment.createdAt)}</TableCell>
                <TableCell>{experiment.layout}</TableCell>
                <TableCell>{experiment.maxOperators}</TableCell>
                <TableCell>{experiment.totalRuns}</TableCell>
                <TableCell>{formatExperimentTime(experiment.bestTime)}</TableCell>
                <TableCell>{formatExperimentTime(experiment.averageTime)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{experiment.status}</Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/experiments/${experiment.id}`}>
                    <Button size="sm" variant="outline" className="gap-2">
                      Abrir
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && !error && filteredExperiments.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                  No hay experimentos con esos filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
