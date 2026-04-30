'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Coordinate {
  id: number
  x: number
  y: number
  name: string
  weight?: number
}

interface CoordinateTableProps {
  coordinates: Coordinate[]
  onUpdateCoordinate: (id: number, x: number, y: number, name?: string) => void
  onRemoveCoordinate: (id: number) => void
}

export function CoordinateTable({
  coordinates,
  onUpdateCoordinate,
  onRemoveCoordinate,
}: CoordinateTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<{ name: string; x: string; y: string }>({ name: '', x: '', y: '' })

  const startEdit = (coord: Coordinate) => {
    setEditingId(coord.id)
    setEditValues({ name: coord.name, x: String(coord.x), y: String(coord.y) })
  }

  const saveEdit = (id: number) => {
    const x = parseFloat(editValues.x)
    const y = parseFloat(editValues.y)

    if (!isNaN(x) && !isNaN(y) && editValues.name.trim()) {
      onUpdateCoordinate(id, x, y, editValues.name)
      setEditingId(null)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  return (
    <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-slate-600">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 border-b-0">
        <CardTitle className="text-white text-lg">Lista de Productos</CardTitle>
        <CardDescription className="text-blue-100">Visualiza y edita las coordenadas</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {coordinates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📍</div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">No hay productos agregados</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Haz clic en el mapa para agregar</p>
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg sticky top-0">
                <div>Producto</div>
                <div>X</div>
                <div>Y</div>
                <div className="col-span-2">Acciones</div>
              </div>

              {coordinates.map((coord) => (
                <div key={coord.id} className="grid grid-cols-5 gap-2 px-4 py-3 border border-blue-100 dark:border-slate-600 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
                  {editingId === coord.id ? (
                    <>
                      <Input
                        type="text"
                        value={editValues.name}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="Nombre"
                      />
                      <Input
                        type="number"
                        value={editValues.x}
                        onChange={(e) => setEditValues({ ...editValues, x: e.target.value })}
                        className="h-8 text-sm"
                        step="0.1"
                      />
                      <Input
                        type="number"
                        value={editValues.y}
                        onChange={(e) => setEditValues({ ...editValues, y: e.target.value })}
                        className="h-8 text-sm"
                        step="0.1"
                      />
                      <Button
                        size="sm"
                        onClick={() => saveEdit(coord.id)}
                        className="h-8 text-xs bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
                      >
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                        className="h-8 text-xs"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center text-sm font-bold text-blue-600 dark:text-blue-400">{coord.name}</div>
                      <div className="flex items-center text-sm">{coord.x.toFixed(1)}</div>
                      <div className="flex items-center text-sm">{coord.y.toFixed(1)}</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(coord)}
                        className="h-8 text-xs"
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onRemoveCoordinate(coord.id)}
                        className="h-8 text-xs"
                      >
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
