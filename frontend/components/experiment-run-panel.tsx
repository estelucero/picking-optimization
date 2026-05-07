"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Coordinate {
  id: number;
  x: number;
  y: number;
  name: string;
}

interface ExperimentRunPanelProps {
  selectedMapping?: {
    id: string;
    name: string;
    coordinates: Coordinate[];
  };
}

export function ExperimentRunPanel({
  selectedMapping,
}: ExperimentRunPanelProps) {
  const router = useRouter();
  const [averageOrders, setAverageOrders] = useState(50);
  const [averageOrderSize, setAverageOrderSize] = useState(2);
  const [iterations, setIterations] = useState(30);
  const [maxOperarios, setMaxOperarios] = useState(15);
  const [isLoading, setIsLoading] = useState(false);

  const handleRun = async () => {
    if (!selectedMapping?.id || !selectedMapping?.coordinates.length) {
      alert("Por favor selecciona un mapeo de productos primero");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/experimentos/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ubicacion_id: selectedMapping.id,
          media_tamano_pedido: averageOrderSize,
          media_pedidos_mes: averageOrders,
          max_operarios: maxOperarios,
          iteraciones: iterations,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail || errorData?.error || "Error en la simulacion");
      }

      const data = await response.json();
      const resultsParam = btoa(JSON.stringify(data.results || []));
      router.push(`/experimentation/results?data=${resultsParam}`);
    } catch (error) {
      console.error("Error durante la simulación:", error);
      alert("Error al ejecutar la simulación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-fit bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-slate-600 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 border-b-0">
        <CardTitle className="text-white text-lg">
          Configuracion de Experimento
        </CardTitle>
        <CardDescription className="text-blue-100">
          Configrua las variables de la simulacion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Selected Mapping Info */}
        <div className="p-4 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-blue-200 dark:border-slate-600">
          <p className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">
            Distribucion
          </p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
            {selectedMapping?.name || "No mapping selected"}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
            {selectedMapping?.coordinates.length || 0} productos
          </p>
        </div>

        {/* Average Orders */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Media de pedidos por mes
          </label>
          <Input
            type="number"
            min="1"
            value={averageOrders}
            onChange={(e) => setAverageOrders(Number(e.target.value))}
            placeholder="e.g., 50"
            className="w-full border-blue-200 dark:border-slate-600 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Media de tamano del pedido
          </label>
          <Input
            type="number"
            min="1"
            value={averageOrderSize}
            onChange={(e) => setAverageOrderSize(Number(e.target.value))}
            placeholder="e.g., 2"
            className="w-full border-blue-200 dark:border-slate-600 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Cantidad de experimentos por n operarios
          </label>
          <Input
            type="number"
            min="1"
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            placeholder="e.g., 30"
            className="w-full border-blue-200 dark:border-slate-600 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Maximum Operators */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Maxima cantidad de operarios
          </label>
          <Input
            type="number"
            min="1"
            max="50"
            value={maxOperarios}
            onChange={(e) => setMaxOperarios(Number(e.target.value))}
            placeholder="e.g., 15"
            className="w-full border-blue-200 dark:border-slate-600 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Se evalua de 1 a {maxOperarios} operarios sobre los mismos escenarios
            de pedidos por iteracion
          </p>
        </div>

        {/* Run Button */}
        <Button
          onClick={handleRun}
          disabled={!selectedMapping?.coordinates.length || isLoading}
          size="lg"
          className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              Running...
            </div>
          ) : (
            "Correr Experimento"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
