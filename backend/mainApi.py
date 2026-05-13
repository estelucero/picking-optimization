from api.routers import experimentos, run_preview
from fastapi import FastAPI
from api.routers import ubicaciones
from api.routers import users
from api.routers import experimento_preview
from api.routers import run

app = FastAPI()

app.include_router(users.router)
app.include_router(experimentos.router)
app.include_router(ubicaciones.router)
app.include_router(experimento_preview.router)
app.include_router(run_preview.router)
app.include_router(run.router)
