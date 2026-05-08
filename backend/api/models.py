from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

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
    iteraciones: int
    casos: list[Caso]


class UbicacionProductoIn(BaseModel):
    codigo: str = Field(..., min_length=1)
    nombre: str = Field(..., min_length=1)
    peso: float = Field(..., gt=0)
    x: float
    y: float

    @field_validator("codigo", "nombre", mode="before")
    @classmethod
    def strip_strings(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value


class UbicacionBase(BaseModel):
    name: str = Field(..., min_length=1)
    productos: list[UbicacionProductoIn] = Field(..., min_length=1)
    deposito: str = "DEPOSITO"

    @field_validator("name", "deposito", mode="before")
    @classmethod
    def strip_fields(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

    @model_validator(mode="after")
    def validate_deposito_in_productos(self):
        codigos = {producto.codigo for producto in self.productos}
        if self.deposito not in codigos:
            raise ValueError("El deposito debe existir dentro de productos por codigo")
        return self


class UbicacionCreate(UbicacionBase):
    pass


class UbicacionUpdate(UbicacionBase):
    pass


class ExperimentoRunRequest(BaseModel):
    ubicacion_id: str = Field(..., min_length=1)
    media_tamano_pedido: float = Field(..., gt=0)
    media_pedidos_mes: float = Field(..., gt=0)
    max_operarios: int = Field(..., ge=1)
    iteraciones: int = Field(..., ge=1)
    beta_picking: float = Field(default=0.5, ge=0)
    seed: int | None = None


