'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SimulationForm } from './simulation-form'
import { CoordinateMap } from './coordinate-map'
import { CoordinateTable } from './coordinate-table'

interface Coordinate {
  id: number
  x: number
  y: number
  name: string
  weight?: number
}

interface SimulationResult {
  operarios: number
  tiempo: number
}

interface SimulationContainerProps {
  onMappingSave?: (coordinates: Coordinate[]) => void
  showSaveOption?: boolean
}

export function SimulationContainer({ onMappingSave, showSaveOption = false }: SimulationContainerProps) {
  const router = useRouter()
  const [coordinates, setCoordinates] = useState<Coordinate[]>([])
  const [averageOrders, setAverageOrders] = useState(50)
  const [maxOperarios, setMaxOperarios] = useState(15)
  const [isLoading, setIsLoading] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [mappingName, setMappingName] = useState('')

  const handleAddCoordinate = useCallback((x: number, y: number) => {
    const productName = `Producto ${nextId}`
    setCoordinates((prev) => [...prev, { id: nextId, x, y, name: productName }])
    setNextId((prev) => prev + 1)
  }, [nextId])

  const handleRemoveCoordinate = useCallback((id: number) => {
    setCoordinates((prev) => prev.filter((coord) => coord.id !== id))
  }, [])

  const handleUpdateCoordinate = useCallback((id: number, x: number, y: number, name?: string) => {
    setCoordinates((prev) =>
      prev.map((coord) => (coord.id === id ? { ...coord, x, y, name: name ?? coord.name } : coord))
    )
  }, [])

  const handleSaveMapping = () => {
    if (showSaveOption && onMappingSave) {
      onMappingSave(coordinates)
      setShowSaveModal(false)
      setMappingName('')
    }
  }

  const handleRun = async () => {
    if (coordinates.length === 0) return

    setIsLoading(true)
    try {
      // Llamar al backend API
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: coordinates,
          averageOrders: averageOrders,
          maxOperarios: maxOperarios,
        }),
      })

      if (!response.ok) {
        throw new Error('Error en la simulación')
      }

      const data = await response.json()
      
      // Serializar datos y navegar a página de resultados
      const resultsParam = btoa(JSON.stringify(data.results || []))
      router.push(`/experimentation/results?data=${resultsParam}`)
    } catch (error) {
      console.error('Error durante la simulación:', error)
      // Mostrar error al usuario si es necesario
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Mapa y Tabla */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-blue-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
            <CoordinateMap
              coordinates={coordinates}
              onAddCoordinate={handleAddCoordinate}
              onRemoveCoordinate={handleRemoveCoordinate}
            />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-blue-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
            <CoordinateTable
              coordinates={coordinates}
              onUpdateCoordinate={handleUpdateCoordinate}
              onRemoveCoordinate={handleRemoveCoordinate}
            />
          </div>
        </div>

        {/* Columna derecha: Formulario */}
        <div>
          <SimulationForm
            coordinates={coordinates}
            averageOrders={averageOrders}
            maxOperarios={maxOperarios}
            onAverageOrdersChange={setAverageOrders}
            onMaxOperariosChange={setMaxOperarios}
            onRun={handleRun}
            isLoading={isLoading}
            showSaveOption={showSaveOption}
            onSave={handleSaveMapping}
          />
        </div>
      </div>
    </div>
  )
}
