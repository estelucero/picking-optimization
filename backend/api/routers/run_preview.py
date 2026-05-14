from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from api.database import run_preview_collection
from api.models import RunPreview

router = APIRouter(
    prefix="/run_preview",
    tags=["Run Preview"],
)
@router.post("/")
def create_run_preview(run_preview: RunPreview):

    doc = run_preview.model_dump()

    doc["experimento_preview_id"] = ObjectId(doc["experimento_preview_id"])

    result = run_preview_collection.insert_one(doc)
    return {"id": str(result.inserted_id)}

@router.get("/")
def get_run_previews(experimento_preview_id: str | None = None,
                     operarios: int | None = None):
    filtros = {}

    if experimento_preview_id is not None:
        filtros["experimento_preview_id"] = ObjectId(experimento_preview_id)
    if operarios is not None:
        filtros["operarios"] = operarios

    runpreviews = []
    for run_preview in run_preview_collection.find(filtros):
        run_preview["_id"] = str(run_preview["_id"])
        run_preview["experimento_preview_id"] = str(run_preview["experimento_preview_id"])
        runpreviews.append(run_preview)
    return runpreviews

@router.get("/{id}")
def get_run_preview(id: str):
    run_preview = run_preview_collection.find_one({"_id": ObjectId(id)})

    if not run_preview:
        raise HTTPException(404, "Run Preview not found")

    run_preview["_id"] = str(run_preview["_id"])
    run_preview["experimento_preview_id"] = str(run_preview["experimento_preview_id"])
    return run_preview