"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Coordinate } from "@/lib/ubicaciones";
import { Plus, Package } from "lucide-react";

interface ProductRegistrationProps {
  coordinates: Coordinate[];
  onAddProduct: (name: string, x: number, y: number, weight: number) => void;
  onDeleteProduct: (id: number) => void;
  onUpdateProduct: (id: number, updates: Partial<Pick<Coordinate, "name" | "weight">>) => void;
  onApplyWeightToAll: (weight: number) => void;
  defaultWeight: number;
}

export function ProductRegistration({
  coordinates,
  onAddProduct,
  onDeleteProduct,
  onUpdateProduct,
  onApplyWeightToAll,
  defaultWeight,
}: ProductRegistrationProps) {
  const [productName, setProductName] = useState("");
  const [xCoord, setXCoord] = useState("0.0");
  const [yCoord, setYCoord] = useState("1.0");
  const [weight, setWeight] = useState(String(defaultWeight));

  useEffect(() => {
    setWeight(String(defaultWeight));
  }, [defaultWeight]);

  const handleMapProduct = () => {
    if (!productName.trim()) {
      alert("Por favor agrega el nombre de producto");
      return;
    }

    const x = parseFloat(xCoord) || 0;
    const y = parseFloat(yCoord) || 0;
    const w = parseFloat(weight) || 0;

    onAddProduct(productName, x, y, w);
    setProductName("");
    setXCoord("0.0");
    setYCoord("1.0");
    setWeight(String(defaultWeight));
  };

  return (
    <div className="space-y-6">
      {/* Register New Product Form */}
      <Card className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 border-b-0">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-white" />
            <CardTitle className="text-white text-lg">
              Registra un nuevo producto
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nombre
            </label>
            <Input
              placeholder="e.g. Silk Thread Gold"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="mt-2 border-blue-200 dark:border-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                X
              </label>
              <Input
                type="number"
                placeholder="0.0"
                value={xCoord}
                onChange={(e) => setXCoord(e.target.value)}
                step="0.1"
                className="mt-2 border-blue-200 dark:border-slate-600"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Y
              </label>
              <Input
                type="number"
                placeholder="0.0"
                value={yCoord}
                onChange={(e) => setYCoord(e.target.value)}
                step="0.1"
                className="mt-2 border-blue-200 dark:border-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Peso (KG)
            </label>
            <Input
              type="number"
              placeholder="5.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="0.1"
              className="mt-2 border-blue-200 dark:border-slate-600"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => onApplyWeightToAll(parseFloat(weight) || 0)}
            className="w-full border-blue-200 dark:border-slate-600"
          >
            Aplicar peso a todos
          </Button>

          <Button
            onClick={handleMapProduct}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar Producto
          </Button>
        </CardContent>
      </Card>

      {/* Recent Assets */}
      <Card className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-slate-900 dark:text-white">
                Productos
              </CardTitle>
            </div>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {coordinates.length} TOTAL
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {coordinates.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No hay productos
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {coordinates.map((coord) => (
                  <div
                    key={coord.id}
                    className="p-3 bg-slate-50 dark:bg-slate-700 border border-blue-100 dark:border-slate-600 rounded-lg hover:border-blue-300 dark:hover:border-slate-500 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Nombre
                          </label>
                          <Input
                            value={coord.name}
                            onChange={(e) => onUpdateProduct(coord.id, { name: e.target.value })}
                            className="mt-1 border-blue-200 dark:border-slate-600"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Peso (KG)
                          </label>
                          <Input
                            type="number"
                            value={coord.weight ?? 0}
                            onChange={(e) => onUpdateProduct(coord.id, { weight: parseFloat(e.target.value) || 0 })}
                            step="0.1"
                            className="mt-1 border-blue-200 dark:border-slate-600"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-3">
                        <div className="flex gap-3">
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            X: {coord.x.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Y: {coord.y.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteProduct(coord.id)}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
