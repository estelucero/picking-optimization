export interface Coordinate {
id: number
x: number
y: number
name: string
weight?: number
isDeposit?: boolean
aisle?: number
row?: number
shelfIndex?: number
slotSide?: "top" | "bottom"
slotIndex?: number
}

export interface WarehouseConfig {
warehouseWidth: number
warehouseHeight: number
numAisles: number
numRows: number
shelvesBetweenStreets: number
verticalStreetWidth: number
verticalStreetHeight: number
horizontalStreetWidth: number
horizontalStreetHeight: number
shelfWidth: number
shelfPlacementMode: "both" | "top" | "bottom"
}

export interface ProductMapping {
  id: string
  name: string
  coordinates: Coordinate[]
  callesVerticales?: number
  callesHorizontales?: number
  estanteriasPorCalle?: number
  createdAt?: string
}

interface BackendProducto {
  codigo: string
  nombre: string
  peso: number
  x: number
  y: number
}

export interface BackendUbicacionPayload {
  name: string
  deposito: string
  productos: BackendProducto[]
  calles_verticales: number
  calles_horizontales: number
  estanterias_por_calle: number
}

export interface BackendUbicacionDocument extends BackendUbicacionPayload {
  id: string
  distancias?: Record<string, Record<string, { metros: number }>>
  caminos?: Record<string, Record<string, { x: number; y: number }[]>>
  created_at?: string
  updated_at?: string
}

const DEPOSITO_CODIGO = "DEPOSITO"
const DEFAULT_CALLES_VERTICALES = 4
const DEFAULT_CALLES_HORIZONTALES = 4
const DEFAULT_ESTANTERIAS_POR_CALLE = 4

interface BackendLayoutConfig {
  callesVerticales?: number
  callesHorizontales?: number
  estanteriasPorCalle?: number
}

function getCodigoProducto(coordinate: Coordinate): string {
  if (coordinate.isDeposit) return DEPOSITO_CODIGO

  return `codigo${coordinate.id}`
}

function getCoordinateId(codigo: string, fallback: number): number {
  const match = codigo.match(/(?:SKU-|codigo)(\d+)/i)
  if (!match?.[1]) return fallback

  const id = Number.parseInt(match[1], 10)
  return Number.isNaN(id) ? fallback : id
}

function toBackendProducto(coordinate: Coordinate): BackendProducto {
  return {
    codigo: getCodigoProducto(coordinate),
    nombre: coordinate.name,
    peso: coordinate.weight ?? 1,
    x: coordinate.x,
    y: coordinate.y,
  }
}

export function toBackendPayload(
  name: string,
  coordinates: Coordinate[],
  config: BackendLayoutConfig = {},
): BackendUbicacionPayload {
  const productCoordinates = coordinates.filter(
    (coordinate) => !coordinate.isDeposit && !(coordinate.x === 0 && coordinate.y === 0),
  )
  const productos = [
    {
      codigo: DEPOSITO_CODIGO,
      nombre: DEPOSITO_CODIGO,
      peso: 1,
      x: 0,
      y: 0,
    },
    ...productCoordinates.map(toBackendProducto),
  ]

  return {
    name,
    deposito: DEPOSITO_CODIGO,
    productos,
    calles_verticales: config.callesVerticales ?? DEFAULT_CALLES_VERTICALES,
    calles_horizontales: config.callesHorizontales ?? DEFAULT_CALLES_HORIZONTALES,
    estanterias_por_calle: config.estanteriasPorCalle ?? DEFAULT_ESTANTERIAS_POR_CALLE,
  }
}

export function toBackendPayloadFromMapping(mapping: ProductMapping): BackendUbicacionPayload {
  return toBackendPayload(mapping.name, mapping.coordinates, {
    callesVerticales: mapping.callesVerticales,
    callesHorizontales: mapping.callesHorizontales,
    estanteriasPorCalle: mapping.estanteriasPorCalle,
  })
}

export function fromBackendDocument(document: BackendUbicacionDocument): ProductMapping {
  const coordinates: Coordinate[] = document.productos
    .filter((producto) => producto.codigo !== document.deposito)
    .map((producto, index) => {
      return {
        id: getCoordinateId(producto.codigo, index + 1),
        x: producto.x,
        y: producto.y,
        name: producto.nombre,
        weight: producto.peso,
      }
    })

  return {
    id: document.id,
    name: document.name,
    coordinates,
    callesVerticales: document.calles_verticales,
    callesHorizontales: document.calles_horizontales,
    estanteriasPorCalle: document.estanterias_por_calle,
    createdAt: document.created_at,
  }
}

export function fromBackendDocumentWithDeposit(document: BackendUbicacionDocument): ProductMapping {
  const deposit = document.productos.find((producto) => producto.codigo === document.deposito)
  const productCoordinates = document.productos
    .filter((producto) => producto.codigo !== document.deposito)
    .map((producto, index) => {
      return {
        id: getCoordinateId(producto.codigo, index + 1),
        x: producto.x,
        y: producto.y,
        name: producto.nombre,
        weight: producto.peso,
      }
    })

  const coordinates: Coordinate[] = deposit
    ? [
        {
          id: 0,
          x: deposit.x,
          y: deposit.y,
          name: deposit.nombre,
          weight: deposit.peso,
          isDeposit: true,
        },
        ...productCoordinates,
      ]
    : productCoordinates

  return {
    id: document.id,
    name: document.name,
    coordinates,
    callesVerticales: document.calles_verticales,
    callesHorizontales: document.calles_horizontales,
    estanteriasPorCalle: document.estanterias_por_calle,
    createdAt: document.created_at,
  }
}
