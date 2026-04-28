from pydantic import BaseModel, Field, field_validator
from typing import Any, List
from .Carro import Carro
from .Producto import Producto
from .Viaje import Viaje
from ..utils.Velocidad import Velocidad
from ..algoritmos.Tsp import TSP


class Operario(BaseModel):
    """
    Representa un operario del depósito que realiza el picking.

    Atributos:
    - codigo: identificador único del operario (ej: "OP-001")
    - nombre: nombre del operario
    - velocidad: objeto Velocidad (en metros por segundo)
    - carro: carro de picking asignado al operario
    - viajes: lista de viajes completados
    """
    codigo: str = Field(..., min_length=1)
    nombre: str = Field(..., min_length=1)
    velocidad: Velocidad
    carro: Carro
    viajes: List[Viaje] = Field(default_factory=list) 
    viaje_actual: Viaje = Viaje(distancia=0, tiempo=0, secuencia=[])
    tiempo_acumulado: float = 0

    @field_validator('codigo', 'nombre', mode='before')
    @classmethod
    def strip_strings(cls, v: Any) -> Any:
        return v.strip() if isinstance(v, str) else v

    def agregar_tiempo(self, tiempo: float) -> None:
        if tiempo < 0:
            raise ValueError(f"El tiempo debe ser no negativo, se recibió: {tiempo}")
        self.tiempo_acumulado += tiempo

    def agregar_producto(self, producto: Producto, cantidad: int, tiempo_nuevo:float, distancia_nueva: float) -> bool:
        """
        Agrega un producto al carro.
        Retorna True si el carro estaba lleno y se debe cerrar el viaje.
        """
        if cantidad <= 0:
            raise ValueError(f"La cantidad debe ser mayor a 0, se recibió: {cantidad}")

        self.carro.agregar_producto(producto, cantidad)
        self.viaje_actual.actualizar_viaje((producto,cantidad), tiempo_nuevo, distancia_nueva)

        return True
    
    def puedo_agregar(self, producto: Producto, cantidad:int) -> bool:

        return self.carro.puede_agregar(producto, cantidad)
    
    def cerrar_viaje(self) -> None:

        self.viajes.append(self.viaje_actual)
        self.agregar_tiempo(self.viaje_actual.tiempo)
        self.viaje_actual = Viaje(distancia=0, tiempo=0, secuencia=[])
        self.carro.vaciar()
        

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Operario):
            return False
        return self.codigo == other.codigo

    def __hash__(self) -> int:
        return hash(self.codigo)

    def __repr__(self) -> str:
        return (
            f"\n \n Operario(codigo='{self.codigo}', nombre='{self.nombre}', "
            f"velocidad={self.velocidad.m_por_segundo}m/s, "
            f"tiempo_acumulado={self.tiempo_acumulado}min) \n"

        )