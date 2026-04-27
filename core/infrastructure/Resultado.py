from pydantic import BaseModel, Field
from typing import Dict, List
from .Operario import Operario
from .Pedido import Pedido
from .Producto import Producto
from .Viaje import Viaje


class Resultado(BaseModel):
    """
    Encapsula el resultado de ejecutar una heurística.

    Atributos:
    - tiempo_minimo: tiempo total de caminos minimos de todos los operarios (en minutos)
    - asignacion: dict {Operario: list[Viaje]} con los viajes de cada operario
    - secuencia: lista de productos en el orden en que fueron procesados
    """

    tiempo_minimo: float = Field(..., gt=0, description="Tiempo total de caminos mínimos en minutos")
    asignacion: Dict[Operario, List[Viaje]]
    secuencia: list[Producto] = []

    def __repr__(self) -> str:
        return (
            f"Resultado(tiempo_minimo={self._tiempo_minimo:.2f} min, "
            f"operarios={len(self._asignacion)}, "
            f"productos={len(self._secuencia)})"
        )