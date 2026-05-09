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
    camino_minimo: list[tuple[Producto,int]]
    

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
    
    def actualizar_viaje(self, paso: tuple[Producto,int], tiempo_nuevo: float, distancia_nueva: float, camino_minimo:list[str]) -> None:
        self.distancia = distancia_nueva
        self.tiempo = tiempo_nuevo
        self.secuencia.append(paso)
        self.actualizar_camino_minimo(camino_minimo)
    
    def actualizar_camino_minimo(self, nuevo_camino: list[str]) -> None:
        
        nuevo_camino_minimo: list[tuple[Producto,int]] = []

        for producto_camino in nuevo_camino:
            for producto, cantidad in self.secuencia:
                if(producto_camino == producto.codigo):
                    nuevo_camino_minimo.append((producto,cantidad))

        self.camino_minimo = nuevo_camino_minimo

        return

    def getPesoTotal(self):
        sumaPesos = 0
        for producto, cantidad in self.secuencia:
            sumaPesos += producto.peso * cantidad
        return sumaPesos

    def __repr__(self) -> str:
        return f"Viaje(distancia={self.distancia}m, tiempo={self.tiempo} min), pesoTotal= {self.getPesoTotal()},\n secuencia={self.secuencia})) \n camino minimo={self.camino_minimo}"