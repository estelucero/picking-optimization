'use client'

import { useRef, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Coordinate {
  id: number
  x: number
  y: number
  name: string
  weight?: number
}

interface CoordinateMapProps {
  coordinates: Coordinate[]
  onAddCoordinate: (x: number, y: number) => void
  onRemoveCoordinate: (id: number) => void
}

export function CoordinateMap({ coordinates, onAddCoordinate, onRemoveCoordinate }: CoordinateMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)

  const MAP_WIDTH = 500
  const MAP_HEIGHT = 500
  const POINT_RADIUS = 8

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Dibujar fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, MAP_WIDTH, MAP_HEIGHT)
    gradient.addColorStop(0, '#f0f9ff')
    gradient.addColorStop(1, '#e0f2fe')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT)

    // Dibujar grid
    ctx.strokeStyle = '#bfdbfe'
    ctx.lineWidth = 1
    const gridSize = 50
    for (let i = 0; i <= MAP_WIDTH; i += gridSize) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, MAP_HEIGHT)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(MAP_WIDTH, i)
      ctx.stroke()
    }

    // Dibujar ejes cartesianos (X e Y)
    const centerX = MAP_WIDTH / 2
    const centerY = MAP_HEIGHT / 2

    // Eje Y (vertical)
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(centerX, 0)
    ctx.lineTo(centerX, MAP_HEIGHT)
    ctx.stroke()

    // Eje X (horizontal)
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, centerY)
    ctx.lineTo(MAP_WIDTH, centerY)
    ctx.stroke()

    // Etiquetas de ejes
    ctx.fillStyle = '#6366f1'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText('NORTH AXIS (Y+)', centerX, 15)

    ctx.textBaseline = 'top'
    ctx.fillText('SOUTH AXIS (Y-)', centerX, MAP_HEIGHT - 15)

    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText('WEST AXIS (X-)', 15, centerY)

    ctx.textAlign = 'left'
    ctx.fillText('EAST AXIS (X+)', MAP_WIDTH - 15, centerY)

    // Dibujar puntos
    coordinates.forEach((coord, index) => {
      const isHovered = hoveredPoint === coord.id

      // Dibujar punto
      ctx.beginPath()
      ctx.arc(coord.x, coord.y, POINT_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = isHovered ? '#3b82f6' : '#0891b2'
      ctx.fill()

      // Dibujar borde
      ctx.strokeStyle = isHovered ? '#60a5fa' : '#06b6d4'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // Sombra cuando está hovereado
      if (isHovered) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'
        ctx.lineWidth = 4
        ctx.stroke()
      }

      // Dibujar número
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(index + 1), coord.x, coord.y)
    })

    // Dibujar borde
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT)
  }, [coordinates, hoveredPoint])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Verificar si hizo clic en un punto existente
    const clickedPoint = coordinates.find((coord) => {
      const distance = Math.sqrt((coord.x - x) ** 2 + (coord.y - y) ** 2)
      return distance <= POINT_RADIUS + 5
    })

    if (clickedPoint) {
      onRemoveCoordinate(clickedPoint.id)
    } else {
      // Agregar nuevo punto
      onAddCoordinate(x, y)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Detectar si está cerca de un punto
    const nearPoint = coordinates.find((coord) => {
      const distance = Math.sqrt((coord.x - x) ** 2 + (coord.y - y) ** 2)
      return distance <= POINT_RADIUS + 10
    })

    setHoveredPoint(nearPoint?.id ?? null)
    canvas.style.cursor = nearPoint ? 'pointer' : 'crosshair'
  }

  const handleCanvasMouseLeave = () => {
    setHoveredPoint(null)
    const canvas = canvasRef.current
    if (canvas) {
      canvas.style.cursor = 'crosshair'
    }
  }

  const clearAllCoordinates = () => {
    coordinates.forEach((coord) => onRemoveCoordinate(coord.id))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cartesian Grid Alpha</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="w-10 h-10 p-0 text-slate-600 dark:text-slate-400"
            title="Zoom In"
          >
            +
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-10 h-10 p-0 text-slate-600 dark:text-slate-400"
            title="Zoom Out"
          >
            −
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-10 h-10 p-0 text-slate-600 dark:text-slate-400"
            title="Reset View"
          >
            ⊡
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex justify-center bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-slate-700 p-4">
        <canvas
          ref={canvasRef}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          className="cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
        >
          🔍
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
        >
          🔍
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
        >
          ⊞
        </Button>
      </div>
    </div>
  )
}
