from fastapi import APIRouter, HTTPException
from core.app.database import experimentos_collection
from core.app.models import Experimento
from core.app.services import ExperimentoService

router = APIRouter(
    prefix="/experimentos",
    tags=["Experimentos"]
)
@router.post("/")
def create_user(experimento: Experimento):
    experimento = ExperimentoService(tamaño_matriz=experimento.tamaño_matriz,
                                     cantidad_pedidos=experimento.cantidad_pedidos,
                                     cantidad_operarios=experimento.cantidad_max_operarios,
                                     iteraciones=experimento.iteraciones)

    result = experimento.promedio_experimentos()
    print(result)
    result = experimentos_collection.insert_one(experimento.model_dump())
    return {"id": str(result.inserted_id)}

@router.get("/")
def get_users():
    experimentos = []
    for experimento in experimentos_collection.find():
        experimento["_id"] = str(experimento["_id"])
        experimentos.append(experimento)
    return experimentos

@router.get("/{email}")
def get_user(email: str):
    experimento = experimentos_collection.find_one({"email": email})

    if not experimento:
        raise HTTPException(404, "User not found")

    experimento["_id"] = str(experimento["_id"])
    return experimento