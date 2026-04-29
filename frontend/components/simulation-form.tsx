'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SimulationFormProps {
  coordinates: Array<{ id: number; x: number; y: number; name: string }>
  averageOrders: number
  maxOperarios: number
  onAverageOrdersChange: (value: number) => void
  onMaxOperariosChange: (value: number) => void
  onRun: () => void
  isLoading: boolean
  showSaveOption?: boolean
  onSave?: () => void
}

export function SimulationForm({
  coordinates,
  averageOrders,
  maxOperarios,
  onAverageOrdersChange,
  onMaxOperariosChange,
  onRun,
  isLoading,
  showSaveOption = false,
  onSave,
}: SimulationFormProps) {
  return (
    <Card className="h-fit bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-slate-600 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 border-b-0">
        <CardTitle className="text-white text-lg">Configuración</CardTitle>
        <CardDescription className="text-blue-100">Parámetros de la simulación</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Cantidad Promedio de Pedidos</label>
          <div className="relative">
            <Input
              type="number"
              min="1"
              value={averageOrders}
              onChange={(e) => onAverageOrdersChange(Number(e.target.value))}
              placeholder="Ej: 50"
              className="w-full border-blue-200 dark:border-slate-600 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Máximo de Operarios</label>
          <div className="relative">
            <Input
              type="number"
              min="1"
              max="50"
              value={maxOperarios}
              onChange={(e) => onMaxOperariosChange(Number(e.target.value))}
              placeholder="Ej: 15"
              className="w-full border-blue-200 dark:border-slate-600 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-2 p-4 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-blue-200 dark:border-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <label className="text-sm font-bold text-blue-900 dark:text-blue-300">
              Productos: <span className="text-blue-600 dark:text-blue-400">{coordinates.length}</span>
            </label>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400 ml-5">
            {coordinates.length === 0
              ? '👆 Haz clic en el mapa para agregar'
              : `✓ ${coordinates.length} producto${coordinates.length !== 1 ? 's' : ''} listo${coordinates.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {showSaveOption ? (
          <Button
            onClick={onSave}
            disabled={coordinates.length === 0}
            size="lg"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Mapping
          </Button>
        ) : (
          <Button
            onClick={onRun}
            disabled={coordinates.length === 0 || isLoading}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                Ejecutando...
              </div>
            ) : (
              'Ejecutar Simulación'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
