from fastapi import APIRouter, HTTPException
from api.database import run_collection
from api.models import Run

router = APIRouter(
    prefix="/run",
    tags=["Run"]
)
@router.post("/")
def create_run(run: Run):
    result = run_collection.insert_one(run.model_dump())
    return {"id": str(result.inserted_id)}

@router.get("/")
def get_runs():
    runs = []
    for run in run_collection.find():
        run["_id"] = str(run["_id"])
        runs.append(run)
    return runs

@router.get("/{id}")
def get_run(id: str):
    run = run_collection.find_one({"_id": id})

    if not run:
        raise HTTPException(404, "Run not found")

    run["_id"] = str(run["_id"])
    return run