'use client'

import { useState, useEffect } from 'react'
import { CoordinateMap } from '@/components/coordinate-map'
import { ProductRegistration } from '@/components/product-registration'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface Coordinate {
  id: number
  x: number
  y: number
  name: string
  weight?: number
}

export default function ProductMappingPage() {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([])
  const [nextId, setNextId] = useState(1)
  const [hasSaved, setHasSaved] = useState(false)

  // Cargar coordenadas guardadas del localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem('currentProductMapping')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCoordinates(parsed)
        if (parsed.length > 0) {
          const maxId = Math.max(...parsed.map((c: Coordinate) => c.id))
          setNextId(maxId + 1)
        }
      } catch (e) {
        console.error('Error loading saved coordinates:', e)
      }
    }
  }, [])

  // Guardar coordenadas en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('currentProductMapping', JSON.stringify(coordinates))
  }, [coordinates])

  const handleAddCoordinate = (name: string, x: number, y: number, weight: number) => {
    const newCoordinate: Coordinate = {
      id: nextId,
      x,
      y,
      name,
      weight,
    }
    setCoordinates((prev) => [...prev, newCoordinate])
    setNextId((prev) => prev + 1)
  }

  const handleRemoveCoordinate = (id: number) => {
    setCoordinates((prev) => prev.filter((c) => c.id !== id))
  }

  const handleSaveMapping = () => {
    if (coordinates.length === 0) {
      alert('Please add at least one product before saving')
      return
    }

    // Guardar como nuevo mapeo
    const mappings = JSON.parse(localStorage.getItem('productMappings') || '[]')
    const timestamp = new Date().toLocaleString()
    const newMapping = {
      id: Date.now().toString(),
      name: `Product Mapping - ${timestamp}`,
      coordinates,
      createdAt: new Date().toISOString(),
    }

    mappings.push(newMapping)
    localStorage.setItem('productMappings', JSON.stringify(mappings))
    localStorage.removeItem('currentProductMapping')
    
    setHasSaved(true)
    alert('Mapping saved successfully!')
    setCoordinates([])
    setNextId(1)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Product Mapping</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create warehouse layouts by mapping products to spatial coordinates
          </p>
        </div>
        {coordinates.length > 0 && (
          <Button
            onClick={handleSaveMapping}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold gap-2"
          >
            Save Mapping
          </Button>
        )}
      </div>

      {/* Main Layout: Map (2/3) + Panel (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mapa Interactivo - 2 columnas */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
            <CoordinateMap
              coordinates={coordinates}
              onAddCoordinate={(x, y) => {
                const productName = `Product ${nextId}`
                handleAddCoordinate(productName, x, y, 5.5)
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
          />

          {/* Link a Experimentation */}
          <Link href="/experimentation">
            <Button
              variant="outline"
              className="w-full mt-6 gap-2 border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700"
            >
              Go to Experimentation <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
