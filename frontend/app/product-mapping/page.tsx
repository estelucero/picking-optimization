"use client";

import { useState, useEffect } from "react";
import { WarehouseCanvas, WarehouseProduct, WarehouseConfig } from "@/components/warehouse-canvas";
import { WarehouseConfigPanel } from "@/components/warehouse-config";
import { ProductRegistration } from "@/components/product-registration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Coordinate, toBackendPayload } from "@/lib/ubicaciones";

const DEFAULT_CONFIG: WarehouseConfig = {
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

function isVerticalStreetCoordinate(x: number, shelvesBetweenStreets: number): boolean {
  return x >= 0 && x % (shelvesBetweenStreets + 1) === shelvesBetweenStreets;
}

function getMaxShelfX(config: WarehouseConfig): number {
  return config.numAisles * (config.shelvesBetweenStreets + 1) + config.shelvesBetweenStreets - 1;
}

type PlacementMode = "product" | "deposit" | "bathroom";

function getProductKind(product: WarehouseProduct): PlacementMode {
  if (product.kind === "deposit" || product.isDeposit || product.codigo === "DEPOSITO") return "deposit";
  if (product.kind === "bathroom" || product.codigo === "BANO") return "bathroom";
  return "product";
}

export default function ProductMappingPage() {
  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [nextId, setNextId] = useState(1);
  const [mappingName, setMappingName] = useState("Nueva distribucion");
  const [defaultWeight] = useState("5.5");
  const [config, setConfig] = useState<WarehouseConfig>(DEFAULT_CONFIG);
  const [placementMode, setPlacementMode] = useState<PlacementMode>("product");

  useEffect(() => {
    const saved = localStorage.getItem("currentProductMapping");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProducts(parsed);
        if (parsed.length > 0) {
          const maxId = Math.max(...parsed.map((c: WarehouseProduct) => c.id).filter((id: number) => id > 0), 0);
          setNextId(maxId + 1);
        }
      } catch (e) {
        console.error("Error loading saved coordinates:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("currentProductMapping", JSON.stringify(products));
  }, [products]);

  const handleAddProduct = (
    x: number,
    y: number,
    aisle: number,
    row: number,
    shelfIndex: number,
    slotSide: "top" | "bottom",
    slotIndex: number,
    kind: PlacementMode = "product",
  ) => {
    if (kind === "deposit") {
      const deposit: WarehouseProduct = {
        id: 0,
        codigo: "DEPOSITO",
        kind: "deposit",
        isDeposit: true,
        x,
        y,
        name: "Depósito",
        weight: 1,
        aisle,
        row,
        shelfIndex,
        slotSide,
        slotIndex,
      };
      setProducts((prev) => [deposit, ...prev.filter((product) => getProductKind(product) !== "deposit")]);
      return;
    }

    if (kind === "bathroom") {
      const bathroom: WarehouseProduct = {
        id: -1,
        codigo: "BANO",
        kind: "bathroom",
        x,
        y,
        name: "Baño",
        weight: 1,
        aisle,
        row,
        shelfIndex,
        slotSide,
        slotIndex,
      };
      setProducts((prev) => [bathroom, ...prev.filter((product) => getProductKind(product) !== "bathroom")]);
      return;
    }

    const newProduct: WarehouseProduct = {
      id: nextId,
      kind: "product",
      x,
      y,
      name: `Producto ${nextId}`,
      weight: parseFloat(defaultWeight) || 0,
      aisle,
      row,
      shelfIndex,
      slotSide,
      slotIndex,
    };
    setProducts((prev) => [...prev, newProduct]);
    setNextId((prev) => prev + 1);
  };

  const handleRemoveProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateProduct = (
    id: number,
    updates: Partial<Pick<WarehouseProduct, "name" | "weight">>,
  ) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, ...updates } : product,
      ),
    );
  };

  const handleApplyWeightToAll = (weight: number) => {
    setProducts((prev) =>
      prev.map((product) => getProductKind(product) === "product" ? { ...product, weight } : product),
    );
  };

  const handleSaveMapping = async () => {
    const normalProducts = products.filter((product) => getProductKind(product) === "product");
    const hasDeposit = products.some((product) => getProductKind(product) === "deposit");
    const hasBathroom = products.some((product) => getProductKind(product) === "bathroom");

    if (normalProducts.length === 0) {
      alert("Please add at least one product before saving");
      return;
    }

    if (!hasDeposit) {
      alert("Selecciona el modo Depósito y ubicalo en la fila superior");
      return;
    }

    if (!hasBathroom) {
      alert("Selecciona el modo Baño y ubicalo en la fila superior");
      return;
    }

    try {
      const coordinates: Coordinate[] = products.map(p => ({
        id: p.id,
        codigo: p.codigo,
        x: p.x,
        y: p.y,
        name: p.name,
        weight: p.weight,
        isDeposit: p.isDeposit,
        kind: p.kind,
        aisle: p.aisle,
        row: p.row,
        shelfIndex: p.shelfIndex,
        slotSide: p.slotSide,
        slotIndex: p.slotIndex,
      }));

      const payload = toBackendPayload(
        mappingName.trim() || "Nueva distribucion",
        coordinates,
        {
          callesVerticales: config.numAisles,
          callesHorizontales: config.numRows,
          estanteriasPorCalle: config.shelvesBetweenStreets,
        },
      );

      console.log("Payload ubicacion", JSON.stringify(payload, null, 2));

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
      alert("Distribucion cargada!");
      setProducts([]);
      setNextId(1);
    } catch (error) {
      console.error("Error saving mapping:", error);
      alert("Error al guardar la distribucion");
    }
  };

  const productsWithCoords: Coordinate[] = products.filter((p) => getProductKind(p) === "product").map(p => ({
    id: p.id,
    codigo: p.codigo,
    x: p.x,
    y: p.y,
    name: p.name,
    weight: p.weight,
    kind: p.kind,
    aisle: p.aisle,
    row: p.row,
    shelfIndex: p.shelfIndex,
    slotSide: p.slotSide,
    slotIndex: p.slotIndex,
  }));

  return (
    <div className="p-8 space-y-6">
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
          {products.length > 0 && (
            <Button
              onClick={handleSaveMapping}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold gap-2"
            >
              Guardar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
            <div className="mb-4 flex flex-wrap gap-2">
              {([
                ["product", "Producto"],
                ["deposit", "Depósito"],
                ["bathroom", "Baño"],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={placementMode === value ? "default" : "outline"}
                  onClick={() => setPlacementMode(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <WarehouseCanvas
              config={config}
              products={products}
              placementMode={placementMode}
              onAddProduct={handleAddProduct}
              onRemoveProduct={handleRemoveProduct}
              readOnly={false}
            />
          </div>
        </div>

        <div className="space-y-6">
          <WarehouseConfigPanel
            config={config}
            onConfigChange={setConfig}
            onReset={() => setConfig(DEFAULT_CONFIG)}
          />

          <ProductRegistration
            coordinates={productsWithCoords}
            onAddProduct={(name, x, y, weight) => {
              const aisle = Math.min(Math.max(0, Math.round(x)), getMaxShelfX(config));
              const row = Math.min(Math.max(1, Math.round(y)), Math.max(1, config.numRows - 1));
              if (Math.round(y) === 0) {
                alert("La fila Y 0 esta reservada para deposito y baño");
                return;
              }

              if (isVerticalStreetCoordinate(aisle, config.shelvesBetweenStreets)) {
                alert("Esa coordenada X corresponde a una calle vertical");
                return;
              }

              if (products.some((product) => Math.round(product.x) === aisle && Math.round(product.y) === row)) {
                alert("Esa estanteria ya tiene un producto asignado");
                return;
              }

              const shelfIndex = 0;
              const slotSide: "top" | "bottom" = "top";
              const slotIndex = 0;
              const product: WarehouseProduct = {
                id: nextId,
                kind: "product",
                x: aisle,
                y: row,
                name: name.trim() || `Producto ${nextId}`,
                weight,
                aisle,
                row,
                shelfIndex,
                slotSide,
                slotIndex,
              };
              setProducts((prev) => [...prev, product]);
              setNextId((prev) => prev + 1);
            }}
            onDeleteProduct={handleRemoveProduct}
            onUpdateProduct={handleUpdateProduct}
            onApplyWeightToAll={handleApplyWeightToAll}
            defaultWeight={parseFloat(defaultWeight) || 0}
          />

          <Link href="/experimentation">
            <Button
              variant="outline"
              className="w-full gap-2 border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700"
            >
              Experimentos <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link href="/distributions">
            <Button
              variant="outline"
              className="w-full gap-2 border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700"
            >
              Ver distribuciones <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
