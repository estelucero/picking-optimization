"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { SimulationChart } from "@/components/simulation-chart";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

interface SimulationResult {
  operarios: number;
  tiempo: number;
}

export function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const dataParam = searchParams.get("data");
      if (dataParam) {
        const decodedData = JSON.parse(atob(dataParam));
        setResults(decodedData);
      }
    } catch (error) {
      console.error("Error al decodificar datos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  const handleBack = () => {
    router.push("/experimentation");
  };

  const resultadoTiempoMinimo =
    results.length > 0
      ? results.reduce((minimo, actual) => {
          if (actual.tiempo < minimo.tiempo) {
            return actual;
          }

          if (actual.tiempo === minimo.tiempo) {
            return actual.operarios < minimo.operarios ? actual : minimo;
          }

          return minimo;
        }, results[0])
      : null;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Resultado
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Analisis de eficiencia operacional a partir de diferentes operarios
          </p>
        </div>
        <Button onClick={handleBack} variant="outline" className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Volver
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-8 shadow-lg">
        <SimulationChart data={results} isLoading={isLoading} />
      </div>

      {!isLoading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Tiempo minimo
            </p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mt-3">
              {resultadoTiempoMinimo?.tiempo.toFixed(2) || "0.00"} min
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Operarios para tiempo minimo
            </p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mt-3">
              {resultadoTiempoMinimo?.operarios || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Tiempo Maximo
            </p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mt-3">
              {Math.max(...results.map((r) => r.tiempo)).toFixed(2)} min
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 dark:border-slate-600 border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 mt-4 font-medium">
            Loading results...
          </p>
        </div>
      )}

      {!isLoading && results.length === 0 && (
        <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-12 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg">
            No data to display
          </p>
          <Button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Back to Experimentation
          </Button>
        </div>
      )}
    </div>
  );
}
