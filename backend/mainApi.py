from core.app.routers import experimentos
from fastapi import FastAPI
from core.app.routers import users

app = FastAPI()

app.include_router(users.router)
app.include_router(experimentos.router)