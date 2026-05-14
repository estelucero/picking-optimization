from bson import ObjectId
from fastapi import APIRouter, HTTPException
from api.database import run_collection
from api.models import Run

router = APIRouter(
    prefix="/run",
    tags=["Run"]
)
@router.post("/")
def create_run(run: Run):

    doc = run.model_dump()

    doc["run_preview_id"] = ObjectId(doc["run_preview_id"])

    result = run_collection.insert_one(doc)
    return {"id": str(result.inserted_id)}

@router.get("/")
def get_runs(run_preview_id: str | None = None):
    filtros = {}

    if run_preview_id is not None:
        filtros["run_preview_id"] = ObjectId(run_preview_id)

    runs = []
    for run in run_collection.find(filtros):
        run["_id"] = str(run["_id"])
        run["run_preview_id"] = str(run["run_preview_id"])
        runs.append(run)
    return runs

@router.get("/{id}")
def get_run(id: str):
    run = run_collection.find_one({"_id": id})

    if not run:
        raise HTTPException(404, "Run not found")

    run["_id"] = str(run["_id"])
    run["run_preview_id"] = str(run["run_preview_id"])

    return run