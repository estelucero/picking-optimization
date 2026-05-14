"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getExperimentById, getRunById, formatExperimentDate, formatExperimentTime } from "@/lib/experimentos";

function formatRoute(route: string[]): string {
  return route.join(" -> ");
}

export default function RunDetailPage() {
  const params = useParams<{ experimentId: string; runId: string }>();
  const searchParams = useSearchParams();

  const operatorCount = Number(searchParams.get("operators") || 1);
  const experiment = getExperimentById(params.experimentId);
  const run = getRunById(params.experimentId, operatorCount, params.runId);

  if (!experiment || !run) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-blue-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">No se encontro el run.</p>
          <Link href={`/experiments/${params.experimentId}`}>
            <Button className="mt-4">Volver al experimento</Button>
          </Link>
        </div>
      </div>
    );
  }

  const assignmentRows = run.assignments.map((assignment) => ({
    ...assignment,
    ordersCount: assignment.orders.length,
  }));

  const orderRows = run.assignments.flatMap((assignment) =>
    assignment.orders.map((order) => ({
      ...order,
      operator: assignment.operator,
    })),
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/experiments" className="hover:text-slate-900 dark:hover:text-white">Experimentos</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/experiments/${experiment.id}?operators=${operatorCount}`} className="hover:text-slate-900 dark:hover:text-white">
            {experiment.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>{run.label}</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          {run.label} · {operatorCount} operarios
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Experimento {experiment.name} · {formatExperimentDate(experiment.createdAt)}
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-blue-100 bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-white dark:border-slate-700">
          <p className="text-sm font-semibold">Pila de pedidos</p>
          <p className="text-sm text-cyan-100">Todos los pedidos del run y su operario asignado</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Operario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderRows.map((order) => (
              <TableRow key={order.code}>
                <TableCell>{order.code}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item) => (
                      <Badge key={`${order.code}-${item.code}`} variant="secondary">
                        {item.code} x{item.quantity}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{order.operator}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-blue-100 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Metricas</p>
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
              <TableCell>{formatExperimentTime(run.totalTime)}</TableCell>
              <TableCell>Distancia total</TableCell>
              <TableCell>{run.totalDistance.toFixed(2)} m</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Pedidos</TableCell>
              <TableCell>{run.ordersCount}</TableCell>
              <TableCell>Operarios</TableCell>
              <TableCell>{run.operatorCount}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-blue-100 bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-3 text-white dark:border-slate-700">
          <p className="text-sm font-semibold">Operarios</p>
          <p className="text-sm text-blue-100">Detalle por operario con tiempos y rutas</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Operario</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead>Tiempo</TableHead>
              <TableHead>Distancia</TableHead>
              <TableHead>Ruta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignmentRows.map((assignment) => (
              <TableRow key={assignment.operator}>
                <TableCell>{assignment.operator}</TableCell>
                <TableCell>{assignment.ordersCount}</TableCell>
                <TableCell>{formatExperimentTime(assignment.totalTime)}</TableCell>
                <TableCell>{assignment.totalDistance.toFixed(2)} m</TableCell>
                <TableCell>{formatRoute(assignment.route)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
