from .Producto import Producto
from pydantic import BaseModel, Field, PositiveFloat, computed_field


class Viaje(BaseModel):
    """
    Representa un viaje realizado por un operario en su carro de picking.

    Atributos:
    - productos: diccionario {Producto: cantidad} con los productos recogidos
    - distancia: distancia total recorrida en metros
    - tiempo: tiempo total del viaje en minutos
    """
    productos: dict[Producto, int] = Field(..., min_length=1)
    distancia: float = Field(..., ge=0)
    tiempo: float = Field(..., ge=0)
    secuencia: list[str]
    peso_total: float = Field(..., alias="pesoTotal", ge=0)

    # Configuración de Pydantic
    model_config = {
        "frozen": True,                
        "populate_by_name": True
    }

    @computed_field
    @property
    def total_items(self) -> int:
        """Cantidad total de ítems en el viaje."""
        return sum(self._productos.values())
    
    @property
    def valor_distancia(self) -> float:
        return self.distancia

    def __repr__(self) -> str:
        return f"Viaje(productos={len(self._productos)}, distancia={self._distancia}m, tiempo={self._tiempo}min), pesoTotal={self._pesoTotal})"