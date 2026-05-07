from api.routers import experimentos
from fastapi import FastAPI
from api.routers import ubicaciones
from api.routers import users

app = FastAPI()

app.include_router(users.router)
app.include_router(experimentos.router)
app.include_router(ubicaciones.router)
