export interface Coordinate {
  id: number
  x: number
  y: number
  name: string
  weight?: number
}

export interface ProductMapping {
  id: string
  name: string
  coordinates: Coordinate[]
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
}

export interface BackendUbicacionDocument extends BackendUbicacionPayload {
  id: string
  created_at?: string
  updated_at?: string
}

const DEPOSITO_CODIGO = "DEPOSITO"

export function toBackendPayload(name: string, coordinates: Coordinate[]): BackendUbicacionPayload {
  const productos = coordinates.map((coordinate) => ({
    codigo: `SKU-${String(coordinate.id).padStart(3, "0")}`,
    nombre: coordinate.name,
    peso: coordinate.weight ?? 1,
    x: coordinate.x,
    y: coordinate.y,
  }))

  productos.unshift({
    codigo: DEPOSITO_CODIGO,
    nombre: "Deposito",
    peso: 1,
    x: 0,
    y: 0,
  })

  return {
    name,
    deposito: DEPOSITO_CODIGO,
    productos,
  }
}

export function fromBackendDocument(document: BackendUbicacionDocument): ProductMapping {
  const coordinates: Coordinate[] = document.productos
    .filter((producto) => producto.codigo !== document.deposito)
    .map((producto, index) => {
      const maybeId = Number.parseInt(producto.codigo.replace("SKU-", ""), 10)
      const id = Number.isNaN(maybeId) ? index + 1 : maybeId

      return {
        id,
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
    createdAt: document.created_at,
  }
}
