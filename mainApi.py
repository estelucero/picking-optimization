from fastapi import FastAPI
from core.app.routers import users, experimentos

app = FastAPI()

app.include_router(users.router)
app.include_router(experimentos.router)