from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Any

class Producto:
    """
    Representa un producto dentro del depósito.
    Cada producto es un nodo en el grafo de ubicaciones.
 
    Atributos:
    - codigo: identificador único del producto (ej: "SKU-001")
    - nombre: nombre descriptivo del producto (ej: "Silla de oficina")
    - peso: peso en kilogramos, debe ser mayor a 0
    - x, y: coordenadas 2D de la ubicación del producto en el depósito
    """

    codigo: str = Field(..., min_length=1, description="Identificador único del producto")
    nombre: str = Field(..., min_length=1, description="Nombre descriptivo del producto")
    peso: float = Field(..., gt=0, description="Peso en kilogramos (> 0)")
    x: float = Field(..., description="Coordenada X en el depósito")
    y: float = Field(..., description="Coordenada Y en el depósito")

    model_config = ConfigDict(frozen=True) 
        
    @field_validator('codigo', 'nombre', mode='before')
    @classmethod
    def strip_strings(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip()
        return v
 
 
    def __repr__(self) -> str:
        return (
            f"Producto(codigo='{self._codigo}', nombre='{self._nombre}', "
            f"peso={self._peso}kg, x={self._x}, y={self._y})"
        )