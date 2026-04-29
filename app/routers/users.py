from fastapi import APIRouter, HTTPException
from app.database import users_collection
from app.models import User

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)
@router.post("/")
def create_user(user: User):
    result = users_collection.insert_one(user.model_dump())
    return {"id": str(result.inserted_id)}

@router.get("/")
def get_users():
    users = []
    for user in users_collection.find():
        user["_id"] = str(user["_id"])
        users.append(user)
    return users

@router.get("/{email}")
def get_user(email: str):
    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(404, "User not found")

    user["_id"] = str(user["_id"])
    return user