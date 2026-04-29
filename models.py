from datetime import datetime

from pydantic import BaseModel, EmailStr

class User(BaseModel):
    name: str
    email: EmailStr
    age: int

class Caso(BaseModel):
    cantidad_operarios: int
    tiempo_promedio: float


class Experimento(BaseModel):
    fecha: datetime
    tamaño_matriz: int
    cantidad_pedidos: int
    cantidad_max_operarios: int
    casos: list[Caso]


