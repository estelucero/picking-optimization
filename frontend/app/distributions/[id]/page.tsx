"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Check, MapPin, Package, Pencil, Plus, Save, X } from "lucide-react";

import { WarehouseCanvas, type WarehouseConfig, type WarehouseProduct } from "@/components/warehouse-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BackendUbicacionDocument,
  ProductMapping,
  fromBackendDocumentWithDeposit,
  toBackendPayloadFromMapping,
} from "@/lib/ubicaciones";

const DEFAULT_WAREHOUSE_CONFIG: WarehouseConfig = {
  warehouseWidth: 1200,
  warehouseHeight: 600,
  numAisles: 4,
  numRows: 4,
  shelvesBetweenStreets: 4,
  verticalStreetWidth: 1.5,
  verticalStreetHeight: 18,
  horizontalStreetWidth: 36,
  horizontalStreetHeight: 0.9,
  shelfWidth: 1,
  shelfPlacementMode: "both",
};

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

export default function DistributionDetailPage() {
  const params = useParams<{ id: string }>();
  const distributionId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const [distribution, setDistribution] = useState<ProductMapping | null>(null);
  const [draftDistribution, setDraftDistribution] = useState<ProductMapping | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDistribution() {
      if (!distributionId) {
        setError("No se pudo resolver la distribucion seleccionada");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/ubicaciones/${distributionId}`, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("No se pudo obtener la distribucion");
        }

        const document = (await response.json()) as BackendUbicacionDocument;
        const parsedDistribution = fromBackendDocumentWithDeposit(document);

        if (!cancelled) {
          setDistribution(parsedDistribution);
          setDraftDistribution(parsedDistribution);
          setIsEditing(false);
        }
      } catch (loadError) {
        console.error("Error loading distribution:", loadError);
        if (!cancelled) {
          setError("No se pudo cargar la distribucion");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDistribution();

    return () => {
      cancelled = true;
    };
  }, [distributionId]);

  const coordinates = useMemo(() => distribution?.coordinates ?? [], [distribution]);
  const draftCoordinates = draftDistribution?.coordinates ?? [];
  const activeCoordinates = isEditing ? draftCoordinates : coordinates;
  const deposit = activeCoordinates.find((coord) => coord.isDeposit);
  const products = activeCoordinates.filter((coord) => !coord.isDeposit);
  const draftDeposit = draftCoordinates.find((coord) => coord.isDeposit);
  const draftProducts = draftCoordinates.filter((coord) => !coord.isDeposit);
  const nextProductId =
    (draftProducts.length > 0 ? Math.max(...draftProducts.map((product) => product.id)) : 0) + 1;
  const warehouseConfig = useMemo<WarehouseConfig>(() => ({
    ...DEFAULT_WAREHOUSE_CONFIG,
    numAisles: distribution?.callesVerticales ?? DEFAULT_WAREHOUSE_CONFIG.numAisles,
    numRows: distribution?.callesHorizontales ?? DEFAULT_WAREHOUSE_CONFIG.numRows,
    shelvesBetweenStreets: distribution?.estanteriasPorCalle ?? DEFAULT_WAREHOUSE_CONFIG.shelvesBetweenStreets,
  }), [distribution]);
  const warehouseProducts = useMemo<WarehouseProduct[]>(() => activeCoordinates
    .filter((coordinate) => !coordinate.isDeposit)
    .map((coordinate) => ({
      id: coordinate.id,
      x: coordinate.x,
      y: coordinate.y,
      name: coordinate.name,
      weight: coordinate.weight,
      aisle: coordinate.aisle ?? Math.round(coordinate.x),
      row: coordinate.row ?? Math.round(coordinate.y),
      shelfIndex: coordinate.shelfIndex ?? 0,
      slotSide: coordinate.slotSide ?? "top",
      slotIndex: coordinate.slotIndex ?? 0,
    })), [activeCoordinates]);

  const updateDistributionName = (name: string) => {
    setDraftDistribution((current) => (current ? { ...current, name } : current));
  };

  const updateProduct = (id: number, updates: Partial<Pick<NonNullable<ProductMapping["coordinates"]>[number], "name" | "weight" | "x" | "y">>) => {
    setDraftDistribution((current) => {
      if (!current) return current;

      return {
        ...current,
        coordinates: current.coordinates.map((coordinate) =>
          coordinate.id === id ? { ...coordinate, ...updates } : coordinate,
        ),
      };
    });
  };

  const addProduct = () => {
    setDraftDistribution((current) => {
      if (!current) return current;

      return {
        ...current,
        coordinates: [
          ...current.coordinates,
          {
            id: nextProductId,
            name: `Producto ${nextProductId}`,
            x: 0,
            y: 0,
            weight: 1,
          },
        ],
      };
    });
  };

  const removeProduct = (id: number) => {
    setDraftDistribution((current) => {
      if (!current) return current;

      return {
        ...current,
        coordinates: current.coordinates.filter((coordinate) => coordinate.id !== id),
      };
    });
  };

  const startEditing = () => {
    setDraftDistribution(distribution);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftDistribution(distribution);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!distributionId || !draftDistribution) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/ubicaciones/${distributionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toBackendPayloadFromMapping(draftDistribution)),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail || errorData?.error || "No se pudo actualizar la distribucion");
      }

      const updatedDocument = (await response.json()) as BackendUbicacionDocument;
      const updatedDistribution = fromBackendDocumentWithDeposit(updatedDocument);
      setDistribution(updatedDistribution);
      setDraftDistribution(updatedDistribution);
      setIsEditing(false);
    } catch (saveError) {
      console.error("Error saving distribution:", saveError);
      setError("No se pudo guardar la distribucion");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Card className="border border-blue-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">Cargando distribución...</p>
        </Card>
      </div>
    );
  }

  if (error || !distribution) {
    return (
      <div className="p-8">
        <Card className="border border-blue-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-600 dark:text-slate-400">{error || "No se encontro la distribucion."}</p>
          <Link href="/distributions">
            <Button className="mt-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/distributions" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Distribuciones
          </Link>
          {isEditing ? (
            <div className="mt-3 max-w-xl">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre de la distribución</label>
              <Input
                value={draftDistribution?.name ?? ""}
                onChange={(event) => updateDistributionName(event.target.value)}
                className="mt-2 border-blue-200 dark:border-slate-600 text-2xl h-12"
              />
            </div>
          ) : (
            <h1 className="mt-2 text-4xl font-bold text-slate-900 dark:text-white">{distribution.name}</h1>
          )}
          <p className="mt-2 text-slate-600 dark:text-slate-400">Detalle completo de la distribución seleccionada.</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">Productos</p>
            <p className="mt-1 font-bold text-slate-900 dark:text-white">{products.length}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500">Depósito</p>
            <p className="mt-1 font-bold text-slate-900 dark:text-white">{deposit?.name || "DEPOSITO"}</p>
          </div>
          </div>
          {!isEditing ? (
            <Button onClick={startEditing} className="gap-2">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={cancelEditing} variant="outline" className="gap-2">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !draftDistribution} className="gap-2">
                {isSaving ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Información</h2>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays className="h-4 w-4" />
                <span>{formatDate(distribution.createdAt)}</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <Package className="h-4 w-4" />
                <span>{products.length} productos + depósito</span>
              </div>
              <div className="mt-3 text-sm text-slate-500">
                Depósito: {draftDeposit ? `X ${draftDeposit.x.toFixed(1)} · Y ${draftDeposit.y.toFixed(1)}` : "sin datos"}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Productos</h3>
              {isEditing && (
                <Button onClick={addProduct} variant="outline" className="mb-3 w-full gap-2 border-blue-200 dark:border-slate-600">
                  <Plus className="h-4 w-4" />
                  Agregar producto
                </Button>
              )}
              <ScrollArea className="h-[56vh] pr-2">
                <div className="space-y-2">
                  {isEditing
                    ? draftProducts.map((product) => (
                        <div key={product.id} className="rounded-xl border border-blue-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 space-y-3">
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nombre</label>
                              <Input
                                value={product.name}
                                onChange={(event) => updateProduct(product.id, { name: event.target.value })}
                                className="mt-1 border-blue-200 dark:border-slate-600"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">X</label>
                                <Input
                                  type="number"
                                  value={product.x}
                                  onChange={(event) => updateProduct(product.id, { x: parseFloat(event.target.value) || 0 })}
                                  step="0.1"
                                  className="mt-1 border-blue-200 dark:border-slate-600"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Y</label>
                                <Input
                                  type="number"
                                  value={product.y}
                                  onChange={(event) => updateProduct(product.id, { y: parseFloat(event.target.value) || 0 })}
                                  step="0.1"
                                  className="mt-1 border-blue-200 dark:border-slate-600"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Peso (KG)</label>
                              <Input
                                type="number"
                                value={product.weight ?? 0}
                                onChange={(event) => updateProduct(product.id, { weight: parseFloat(event.target.value) || 0 })}
                                step="0.1"
                                className="mt-1 border-blue-200 dark:border-slate-600"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeProduct(product.id)}
                              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))
                    : products.map((product) => (
                        <div key={product.id} className="rounded-xl border border-blue-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 space-y-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{product.name}</p>
                          <p className="text-xs text-slate-500">
                            X: {product.x.toFixed(1)} · Y: {product.y.toFixed(1)} · Peso: {product.weight?.toFixed(1) ?? "0.0"} kg
                          </p>
                        </div>
                      ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mapa</h2>
                <p className="text-sm text-slate-500">Depósito en naranja y productos en azul</p>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
              <WarehouseCanvas
                config={warehouseConfig}
                products={warehouseProducts}
                onAddProduct={() => {}}
                onRemoveProduct={() => {}}
                readOnly
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
