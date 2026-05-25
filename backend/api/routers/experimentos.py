from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException

from api.database import experimentos_collection, ubicaciones_collection
from api.models import ExperimentoRunRequest
from api.services import ExperimentoService

router = APIRouter(
    prefix="/experimentos",
    tags=["Experimentos"],
)


def _to_object_id(value: str, detail: str) -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId as exc:
        raise HTTPException(status_code=400, detail=detail) from exc


def _serialize_experimento(document: dict) -> dict:
    document["id"] = str(document.pop("_id"))
    if "ubicacion_id" in document and isinstance(document["ubicacion_id"], ObjectId):
        document["ubicacion_id"] = str(document["ubicacion_id"])
    if "experimento_preview_id" in document and isinstance(document["experimento_preview_id"], ObjectId):
        document["experimento_preview_id"] = str(document["experimento_preview_id"])
    return document


@router.post("/run")
def run_experimento(payload: ExperimentoRunRequest):
    ubicacion_object_id = _to_object_id(payload.ubicacion_id, "Invalid ubicacion id")

    ubicacion = ubicaciones_collection.find_one({"_id": ubicacion_object_id})
    if not ubicacion:
        raise HTTPException(status_code=404, detail="Ubicacion not found")

    resultado = ExperimentoService.ejecutar_desde_ubicacion(ubicacion, payload)
    now = datetime.now(timezone.utc)

    documento_experimento = {
        "ubicacion_id": ubicacion_object_id,
        "experimento_preview_id": _to_object_id(
        resultado["experimento_preview_id"],
        "Invalid experimento preview id",
        ),
        "parametros": payload.model_dump(),
        "resultado": resultado["resultado"],
        "created_at": now,
    }
    inserted = experimentos_collection.insert_one(documento_experimento)

    return {
        "id": str(inserted.inserted_id),
        "experimento_preview_id": resultado["experimento_preview_id"],
        "results": [
            {
                "operarios": item["operarios"],
                "tiempo": item["tiempo"],
            }
            for item in resultado["resultado"]["resultados"]
        ],
        "resultado": resultado["resultado"],
    }


@router.get("/")
def get_experimentos():
    experimentos = []
    for experimento in experimentos_collection.find().sort("created_at", -1):
        experimentos.append(_serialize_experimento(experimento))
    return experimentos


@router.get("/{experimento_id}")
def get_experimento(experimento_id: str):
    experimento_object_id = _to_object_id(experimento_id, "Invalid experimento id")
    experimento = experimentos_collection.find_one({"_id": experimento_object_id})

    if not experimento:
        raise HTTPException(status_code=404, detail="Experimento not found")

    return _serialize_experimento(experimento)
