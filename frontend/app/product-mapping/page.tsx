"use client";

import { useState, useEffect } from "react";
import { CoordinateMap } from "@/components/coordinate-map";
import { ProductRegistration } from "@/components/product-registration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Coordinate, toBackendPayload } from "@/lib/ubicaciones";

export default function ProductMappingPage() {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [nextId, setNextId] = useState(1);
  const [hasSaved, setHasSaved] = useState(false);
  const [mappingName, setMappingName] = useState("Nueva distribucion");
  const [defaultWeight, setDefaultWeight] = useState("5.5");

  // Cargar coordenadas guardadas del localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem("currentProductMapping");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCoordinates(parsed);
        if (parsed.length > 0) {
          const maxId = Math.max(...parsed.map((c: Coordinate) => c.id));
          setNextId(maxId + 1);
        }
      } catch (e) {
        console.error("Error loading saved coordinates:", e);
      }
    }
  }, []);

  // Guardar coordenadas en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem("currentProductMapping", JSON.stringify(coordinates));
  }, [coordinates]);

  const handleAddCoordinate = (
    name: string,
    x: number,
    y: number,
    weight: number,
  ) => {
    const newCoordinate: Coordinate = {
      id: nextId,
      x,
      y,
      name,
      weight,
    };
    setCoordinates((prev) => [...prev, newCoordinate]);
    setNextId((prev) => prev + 1);
  };

  const handleRemoveCoordinate = (id: number) => {
    setCoordinates((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCoordinate = (
    id: number,
    updates: Partial<Pick<Coordinate, "name" | "weight">>,
  ) => {
    setCoordinates((prev) =>
      prev.map((coordinate) =>
        coordinate.id === id ? { ...coordinate, ...updates } : coordinate,
      ),
    );
  };

  const handleApplyWeightToAll = (weight: number) => {
    setCoordinates((prev) =>
      prev.map((coordinate) => ({ ...coordinate, weight })),
    );
  };

  const handleSaveMapping = async () => {
    if (coordinates.length === 0) {
      alert("Please add at least one product before saving");
      return;
    }

    try {
      const payload = toBackendPayload(
        mappingName.trim() || "Nueva distribucion",
        coordinates,
      );

      //! DEUDA TECNICA BORRAR PARA PASAR A MODELO
      payload.productos.unshift({
        codigo: "DEPOSITO",
        nombre: "DEPOSITO",
        peso: 0.1,
        x: 0,
        y: 0,
      });

      const response = await fetch("/api/ubicaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.detail ||
            errorData?.error ||
            "No se pudo guardar la distribucion",
        );
      }

      localStorage.removeItem("currentProductMapping");
      setHasSaved(true);
      alert("Distribucion cargada!");
      setCoordinates([]);
      setNextId(1);
    } catch (error) {
      console.error("Error saving mapping:", error);
      alert("Error al guardar la distribucion");
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Distribuciones
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Crea la distribucion fisica de tu deposito
          </p>
          <div className="max-w-md space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nombre de la distribución
            </label>
            <Input
              value={mappingName}
              onChange={(e) => setMappingName(e.target.value)}
              placeholder="Nueva distribución"
              className="border-blue-200 dark:border-slate-600"
            />
          </div>
        </div>
        <div className="space-y-3 lg:w-64">
          {coordinates.length > 0 && (
            <Button
              onClick={handleSaveMapping}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold gap-2"
            >
              Guardar
            </Button>
          )}
        </div>
      </div>

      {/* Main Layout: Map (2/3) + Panel (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mapa Interactivo - 2 columnas */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
            <CoordinateMap
              coordinates={coordinates}
              onAddCoordinate={(x, y) => {
                const productName = `Producto ${nextId}`;
                handleAddCoordinate(
                  productName,
                  x,
                  y,
                  parseFloat(defaultWeight) || 0,
                );
              }}
              onRemoveCoordinate={handleRemoveCoordinate}
            />
          </div>
        </div>

        {/* Panel Derecho - 1 columna */}
        <div>
          <ProductRegistration
            coordinates={coordinates}
            onAddProduct={handleAddCoordinate}
            onDeleteProduct={handleRemoveCoordinate}
            onUpdateProduct={handleUpdateCoordinate}
            onApplyWeightToAll={handleApplyWeightToAll}
            defaultWeight={parseFloat(defaultWeight) || 0}
          />

          {/* Link a Experimentation */}
          <Link href="/experimentation">
            <Button
              variant="outline"
              className="w-full mt-6 gap-2 border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700"
            >
              Experimentos <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link href="/distributions">
            <Button
              variant="outline"
              className="w-full mt-3 gap-2 border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700"
            >
              Ver distribuciones <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
