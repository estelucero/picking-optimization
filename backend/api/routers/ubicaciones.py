from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException

from api.database import ubicaciones_collection
from api.models import UbicacionCreate, UbicacionUpdate
from core.infrastructure.Producto import Producto
from core.infrastructure.Ubicaciones import Ubicaciones as CoreUbicaciones

router = APIRouter(
    prefix="/ubicaciones",
    tags=["Ubicaciones"],
)


def _serialize_ubicacion(document: dict) -> dict:
    document["id"] = str(document.pop("_id"))
    return document


def _to_object_id(ubicacion_id: str) -> ObjectId:
    try:
        return ObjectId(ubicacion_id)
    except InvalidId as exc:
        raise HTTPException(status_code=400, detail="Invalid ubicacion id") from exc


def crear_grafo(ubicacion) -> CoreUbicaciones:
    productos = [Producto(**producto.model_dump()) for producto in ubicacion.productos]

    doc = ubicacion.model_dump()

    return CoreUbicaciones(productos=productos,
                    calles_verticales=doc["calles_verticales"],
                    calles_horizontales=doc["calles_horizontales"],
                    estanterias_por_calle=doc["estanterias_por_calle"])


@router.post("/")
def create_ubicacion(ubicacion: UbicacionCreate):
    grafo = crear_grafo(ubicacion)

    now = datetime.now(timezone.utc)
    document = ubicacion.model_dump()
    document["distancias"] = grafo.model_dump()["distancias"]
    document["created_at"] = now
    document["updated_at"] = now

    result = ubicaciones_collection.insert_one(document)
    created = ubicaciones_collection.find_one({"_id": result.inserted_id})
    return _serialize_ubicacion(created)


@router.get("/")
def get_ubicaciones():
    ubicaciones = []
    for ubicacion in ubicaciones_collection.find().sort("created_at", -1):
        ubicaciones.append(_serialize_ubicacion(ubicacion))
    return ubicaciones


@router.get("/{ubicacion_id}")
def get_ubicacion(ubicacion_id: str):
    object_id = _to_object_id(ubicacion_id)
    ubicacion = ubicaciones_collection.find_one({"_id": object_id})

    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicacion not found")

    return _serialize_ubicacion(ubicacion)


@router.put("/{ubicacion_id}")
def update_ubicacion(ubicacion_id: str, payload: UbicacionUpdate):
    object_id = _to_object_id(ubicacion_id)
    existing = ubicaciones_collection.find_one({"_id": object_id})

    if not existing:
        raise HTTPException(status_code=404, detail="Ubicacion not found")

    _validar_con_core(payload.productos)

    now = datetime.now(timezone.utc)
    grafo = crear_grafo(payload)
    update_document = payload.model_dump()
    update_document["distancias"] = grafo.model_dump()["distancias"]
    update_document["updated_at"] = now
    update_document["created_at"] = existing.get("created_at", now)

    ubicaciones_collection.update_one({"_id": object_id}, {"$set": update_document})

    updated = ubicaciones_collection.find_one({"_id": object_id})
    return _serialize_ubicacion(updated)


@router.delete("/{ubicacion_id}")
def delete_ubicacion(ubicacion_id: str):
    object_id = _to_object_id(ubicacion_id)
    result = ubicaciones_collection.delete_one({"_id": object_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ubicacion not found")

    return {"message": "Ubicacion deleted"}
