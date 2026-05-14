from fastapi import APIRouter, HTTPException
from api.database import experimento_preview_collection
from api.models import User, ExperimentoPreview

router = APIRouter(
    prefix="/experimento_preview",
    tags=["Experimento Preview"]
)
@router.post("/")
def create_experimento_preview(experimento_preview: ExperimentoPreview):
    result = experimento_preview_collection.insert_one(experimento_preview.model_dump())
    return {"id": str(result.inserted_id)}

@router.get("/")
def get_experimento_previews():
    experimento_previews = []
    for experimento_preview in experimento_preview_collection.find():
        experimento_preview["_id"] = str(experimento_preview["_id"])
        experimento_previews.append(experimento_preview)
    return experimento_previews

@router.get("/{id}")
def get_experimento_preview(id: str):
    experimento_preview = experimento_preview_collection.find_one({"_id": id})

    if not experimento_preview:
        raise HTTPException(404, "ExperimentoPreview not found")

    experimento_preview["_id"] = str(experimento_preview["_id"])
    return experimento_preview