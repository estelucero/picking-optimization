"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { WarehouseConfig } from "@/components/warehouse-canvas";

interface WarehouseConfigPanelProps {
  config: WarehouseConfig;
  onConfigChange: (config: WarehouseConfig) => void;
  onReset?: () => void;
}

export function WarehouseConfigPanel({ config, onConfigChange, onReset }: WarehouseConfigPanelProps) {
  const update = (updates: Partial<WarehouseConfig>) => onConfigChange({ ...config, ...updates });

  return (
    <Card className="border border-blue-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <CardHeader>
        <CardTitle>Configuracion del deposito</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Cantidad de calles verticales</Label>
          <div className="flex items-center gap-3">
            <Slider value={[config.numAisles]} min={1} max={10} step={1} onValueChange={([v]) => update({ numAisles: v })} />
            <Input className="w-16" type="number" value={config.numAisles} onChange={(e) => update({ numAisles: Math.max(1, Number(e.target.value) || 1) })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cantidad de calles horizontales (par)</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[config.numRows]}
              min={2}
              max={12}
              step={2}
              onValueChange={([v]) => update({ numRows: Math.max(2, v % 2 === 0 ? v : v + 1) })}
            />
            <Input
              className="w-16"
              type="number"
              min={2}
              step={2}
              value={config.numRows}
              onChange={(e) => {
                const raw = Math.max(2, Number(e.target.value) || 2)
                update({ numRows: raw % 2 === 0 ? raw : raw + 1 })
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Estanterias entre calles verticales</Label>
          <div className="flex items-center gap-3">
            <Slider value={[config.shelvesBetweenStreets]} min={1} max={12} step={1} onValueChange={([v]) => update({ shelvesBetweenStreets: v })} />
            <Input className="w-16" type="number" value={config.shelvesBetweenStreets} onChange={(e) => update({ shelvesBetweenStreets: Math.max(1, Number(e.target.value) || 1) })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Ancho estanteria</Label>
            <Input type="number" step="0.1" min={0.5} value={config.shelfWidth} onChange={(e) => update({ shelfWidth: Math.max(0.5, Number(e.target.value) || 0.5) })} />
          </div>
          <div className="space-y-2">
            <Label>Ancho calle vertical</Label>
            <Input type="number" step="0.1" min={0.5} value={config.verticalStreetWidth} onChange={(e) => update({ verticalStreetWidth: Math.max(0.5, Number(e.target.value) || 0.5) })} />
          </div>
          <div className="space-y-2">
            <Label>Alto calle vertical</Label>
            <Input type="number" step="0.5" min={1} value={config.verticalStreetHeight} onChange={(e) => update({ verticalStreetHeight: Math.max(1, Number(e.target.value) || 1) })} />
          </div>
          <div className="space-y-2">
            <Label>Ancho calle horizontal</Label>
            <Input type="number" step="0.5" min={1} value={config.horizontalStreetWidth} onChange={(e) => update({ horizontalStreetWidth: Math.max(1, Number(e.target.value) || 1) })} />
          </div>
          <div className="space-y-2">
            <Label>Alto calle horizontal</Label>
            <Input type="number" step="0.1" min={0.2} value={config.horizontalStreetHeight} onChange={(e) => update({ horizontalStreetHeight: Math.max(0.2, Number(e.target.value) || 0.2) })} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Ubicacion de estanterias respecto de calle horizontal</Label>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              value={config.shelfPlacementMode}
              onChange={(e) => update({ shelfPlacementMode: e.target.value as "both" | "top" | "bottom" })}
            >
              <option value="both">Arriba y abajo</option>
              <option value="top">Solo arriba</option>
              <option value="bottom">Solo abajo</option>
            </select>
          </div>
        </div>

        {onReset ? (
          <Button variant="outline" className="w-full" onClick={onReset}>
            Restablecer
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
