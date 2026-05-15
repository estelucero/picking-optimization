"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BackendUbicacionDocument, ProductMapping, fromBackendDocumentWithDeposit } from "@/lib/ubicaciones";

function formatDate(value?: string): string {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function DistributionsPage() {
  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMappings() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ubicaciones", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("No se pudieron obtener las distribuciones");
        }

        const documents: BackendUbicacionDocument[] = await response.json();
        const parsedMappings = documents.map(fromBackendDocumentWithDeposit);

        if (!cancelled) {
          setMappings(parsedMappings);
        }
      } catch (loadError) {
        console.error("Error loading distributions:", loadError);
        if (!cancelled) {
          setError("No se pudieron cargar las distribuciones");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMappings();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredMappings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return mappings.filter((mapping) => {
      return normalizedQuery.length === 0 || mapping.name.toLowerCase().includes(normalizedQuery);
    });
  }, [mappings, query]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Distribuciones</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Tabla de distribuciones guardadas para abrir su detalle y mapa.
          </p>
        </div>
        <Link href="/product-mapping">
          <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
            Crear distribución
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Card className="border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar distribución" className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Distribución</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Depósito</TableHead>
              <TableHead>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  Cargando distribuciones...
                </TableCell>
              </TableRow>
            )}

            {error && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && filteredMappings.map((mapping) => {
              const productsCount = mapping.coordinates.filter((coord) => !coord.isDeposit).length;
              const deposit = mapping.coordinates.find((coord) => coord.isDeposit);

              return (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900 dark:text-white">{mapping.name}</div>
                    <div className="text-xs text-slate-500">{mapping.id}</div>
                  </TableCell>
                  <TableCell>{formatDate(mapping.createdAt)}</TableCell>
                  <TableCell>{productsCount}</TableCell>
                  <TableCell>{deposit?.name || "DEPOSITO"}</TableCell>
                  <TableCell>
                    <Link href={`/distributions/${mapping.id}`}>
                      <Button size="sm" variant="outline" className="gap-2">
                        Ver
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}

            {!isLoading && !error && filteredMappings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  No hay distribuciones con esos filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
