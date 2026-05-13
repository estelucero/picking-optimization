from fastapi import APIRouter, HTTPException
from api.database import run_preview_collection
from api.models import RunPreview

router = APIRouter(
    prefix="/run_preview",
    tags=["Run Preview"],
)
@router.post("/")
def create_run_preview(run_preview: RunPreview):
    result = run_preview_collection.insert_one(run_preview.model_dump())
    return {"id": str(result.inserted_id)}

@router.get("/")
def get_run_previews():
    runpreviews = []
    for run_preview in run_preview_collection.find():
        run_preview["_id"] = str(run_preview["_id"])
        runpreviews.append(run_preview)
    return runpreviews

@router.get("/{id}")
def get_run_preview(id: str):
    run_preview = run_preview_collection.find_one({"_id": id})

    if not run_preview:
        raise HTTPException(404, "Run Preview not found")

    run_preview["_id"] = str(run_preview["_id"])
    return run_preview