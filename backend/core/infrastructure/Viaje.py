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
    #productos: dict[Producto, int] = Field(..., min_length=1)
    distancia: float = Field(..., ge=0)
    tiempo: float = Field(..., ge=0)
    secuencia: list[tuple[Producto,int]]
    

    # Configuración de Pydantic
    model_config = {
                        
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
    
    def actualizar_viaje(self, paso: tuple[Producto,int], tiempo_nuevo: float, distancia_nueva: float) -> None:
        self.distancia = distancia_nueva
        self.tiempo = tiempo_nuevo
        self.secuencia.append(paso)

    def getPesoTotal(self):
        sumaPesos = 0
        for producto, cantidad in self.secuencia:
            sumaPesos += producto.peso * cantidad
        return sumaPesos

    def __repr__(self) -> str:
        return f"Viaje(distancia={self.distancia}m, tiempo={self.tiempo} min), pesoTotal= {self.getPesoTotal()},\n secuencia={self.secuencia})) \n"