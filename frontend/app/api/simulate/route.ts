import { NextRequest, NextResponse } from 'next/server'

interface Coordinate {
  id: number
  x: number
  y: number
}

interface SimulationRequest {
  coordinates: Coordinate[]
  averageOrders: number
  maxOperarios?: number
}

interface SimulationResult {
  operarios: number
  tiempo: number
}

/**
 * Calcula la distancia euclidiana entre dos coordenadas
 */
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

/**
 * Simula la ejecución logística con diferentes números de operarios
 * y devuelve resultados de tiempo vs operarios
 */
function simulateDelivery(coordinates: Coordinate[], averageOrders: number, maxOperarios: number = 15): SimulationResult[] {
  const results: SimulationResult[] = []

  // Probar diferentes números de operarios (1 a cantidad de coordenadas)
  for (let numWorkers = 1; numWorkers <= Math.min(coordinates.length, maxOperarios); numWorkers++) {
    // Calcular tiempo base: suma de todas las distancias
    let totalDistance = 0
    for (let i = 0; i < coordinates.length - 1; i++) {
      const dist = calculateDistance(
        coordinates[i].x,
        coordinates[i].y,
        coordinates[i + 1].x,
        coordinates[i + 1].y
      )
      totalDistance += dist
    }

    // Dividir el trabajo entre operarios
    const distancePerWorker = totalDistance / numWorkers

    // Simular tiempo considerando:
    // - Distancia promedio por operario
    // - Velocidad de recorrido (píxeles por minuto)
    // - Tiempo adicional por orden
    const speedPixelsPerMinute = 100 // píxeles/minuto
    const timePerOrder = 2 // minutos por orden

    const travelTime = distancePerWorker / speedPixelsPerMinute
    const ordersPerWorker = averageOrders / numWorkers
    const orderTime = ordersPerWorker * timePerOrder

    // Tiempo total es el máximo entre viaje y órdenes (trabajo paralelo)
    const totalTime = Math.max(travelTime, orderTime)

    results.push({
      operarios: numWorkers,
      tiempo: Math.round(totalTime * 10) / 10, // Redondear a 1 decimal
    })
  }

  return results
}

export async function POST(request: NextRequest) {
  try {
    const body: SimulationRequest = await request.json()

    // Validar entrada
    if (!Array.isArray(body.coordinates) || body.coordinates.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren coordenadas válidas' },
        { status: 400 }
      )
    }

    if (typeof body.averageOrders !== 'number' || body.averageOrders < 1) {
      return NextResponse.json(
        { error: 'Cantidad de pedidos debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Ejecutar simulación
    const results = simulateDelivery(body.coordinates, body.averageOrders, body.maxOperarios)

    return NextResponse.json({
      success: true,
      results: results,
      simulationParams: {
        coordinatesCount: body.coordinates.length,
        averageOrders: body.averageOrders,
        maxOperarios: body.maxOperarios || 15,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error en simulación:', error)
    return NextResponse.json(
      { error: 'Error procesando la simulación' },
      { status: 500 }
    )
  }
}
