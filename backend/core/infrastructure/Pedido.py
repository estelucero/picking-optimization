from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from typing import Dict
from .Producto import Producto


class Pedido(BaseModel):
    """
    Representa un pedido de un cliente en el depósito.

    Atributos:
    - codigo: identificador único del pedido (ej: "PED-001")
    - cliente: nombre o identificador del cliente
    - items: diccionario {Producto: cantidad} con los productos solicitados
    """
    model_config = ConfigDict(frozen=True)

    codigo: str = Field(..., min_length=1, description="Identificador único del pedido")
    cliente: str = Field(..., min_length=1, description="Nombre o ID del cliente")
    items: Dict[Producto, int] = Field(..., description="Diccionario {Producto: cantidad}")

    @field_validator('codigo', 'cliente', mode='before')
    @classmethod
    def strip_strings(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

    @field_validator('items')
    @classmethod
    def validar_cantidades_positivas(cls, v: Dict[Producto, int]) -> Dict[Producto, int]:
        if not isinstance(v, dict):
            raise ValueError("items debe ser un diccionario")
        if len(v) == 0:
            raise ValueError("items debe tener al menos un producto")
        for prod, cant in v.items():
            if not isinstance(prod, Producto):
                raise ValueError("Las claves deben ser Producto")
            if not isinstance(cant, int) or cant <= 0:
                raise ValueError(f"Cantidad inválida para {prod.codigo}: {cant}")
        return v

    def total_items(self) -> int:
        """Retorna la cantidad total de ítems del pedido."""
        return sum(self.items.values())

    def productos(self) -> set[Producto]:
        """Retorna el conjunto de productos del pedido (sin cantidades)."""
        return set(self.items.keys())

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Pedido):
            return False
        return self.codigo == other.codigo

    def __hash__(self) -> int:
        return hash(self.codigo)

    def __repr__(self) -> str:
        return (
            f"Pedido(codigo='{self.codigo}', cliente='{self.cliente}', "
            f"total_items={self.total_items()})"
        )