"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExperimentRunPanel } from "@/components/experiment-run-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import {
  BackendUbicacionDocument,
  ProductMapping,
  fromBackendDocument,
} from "@/lib/ubicaciones";

export default function ExperimentationPage() {
  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<ProductMapping | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMappings = async () => {
      try {
        const response = await fetch("/api/ubicaciones", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("No se pudieron obtener las distribuciones");
        }

        const documents: BackendUbicacionDocument[] = await response.json();
        const parsedMappings = documents.map(fromBackendDocument);

        setMappings(parsedMappings);
        if (parsedMappings.length > 0) {
          setSelectedMapping(parsedMappings[0]);
        }
      } catch (error) {
        console.error("Error loading mappings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMappings();
  }, []);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Experimentos
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Ejecuta simulaciones dado una distribución
          </p>
        </div>
        {mappings.length === 0 && (
          <Link href="/product-mapping">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              Crea una distribucion <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600 dark:text-slate-400">
            Cargando distribuciones...
          </div>
        </div>
      ) : mappings.length === 0 ? (
        <Card className="p-8 text-center bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            No se encontraron distribuciones
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Se necesita crear una distribución primero para correr los
            experimentos.
          </p>
          <Link href="/product-mapping">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Crea una distribucion
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mappings List */}
          <div className="lg:col-span-2">
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Distribuciones disponibles
              </h2>
              {mappings.map((mapping) => (
                <Card
                  key={mapping.id}
                  className={`p-4 cursor-pointer border-2 transition-all ${
                    selectedMapping?.id === mapping.id
                      ? "border-blue-500 bg-blue-50 dark:bg-slate-700 dark:border-blue-400"
                      : "border-blue-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600"
                  }`}
                  onClick={() => setSelectedMapping(mapping)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {mapping.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {mapping.coordinates.length} products
                      </p>
                    </div>
                    {/* {selectedMapping?.id === mapping.id && (
                      <div className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                        Selected
                      </div>
                    )} */}
                  </div>
                </Card>
              ))}
            </div>

            <Link href="/product-mapping" className="mt-6 block">
              <Button variant="outline" className="w-full gap-2">
                + Crear nueva distribucion
              </Button>
            </Link>
          </div>

          {/* Experiment Configuration */}
          <div>
            <ExperimentRunPanel
              selectedMapping={selectedMapping || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
