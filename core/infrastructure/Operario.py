from pydantic import BaseModel, Field, field_validator
from typing import Any, List
from .Carro import Carro
from .Producto import Producto
from .Viaje import Viaje
from ..utils.Velocidad import Velocidad


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
    tiempo_acumulado: float = 0.0

    @field_validator('codigo', 'nombre', mode='before')
    @classmethod
    def strip_strings(cls, v: Any) -> Any:
        return v.strip() if isinstance(v, str) else v

    def agregar_tiempo(self, tiempo: float) -> None:
        if tiempo < 0:
            raise ValueError(f"El tiempo debe ser no negativo, se recibió: {tiempo}")
        self.tiempo_acumulado += tiempo

    def agregar_producto(self, producto: Producto, cantidad: int) -> bool:
        """
        Agrega un producto al carro.
        Retorna True si el carro estaba lleno y se debe cerrar el viaje.
        """
        if cantidad <= 0:
            raise ValueError(f"La cantidad debe ser mayor a 0, se recibió: {cantidad}")

        self.carro.agregar_producto(producto, cantidad)
        return True
    
    def puedo_agregar(self, producto: Producto, cantidad:int) -> bool:

        return self.carro.puede_agregar(producto, cantidad)

    def agregar_viaje(self, viaje: Viaje) -> None:
        """Guarda un viaje completado en la lista de viajes."""
        if not isinstance(viaje, Viaje):
            raise ValueError(f"Se esperaba un Viaje, se recibió: {type(viaje)}")
            
        self.viajes.append(viaje)
        self.tiempo_acumulado += viaje.tiempo

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Operario):
            return False
        return self._codigo == other._codigo

    def __hash__(self) -> int:
        return hash(self._codigo)

    def __repr__(self) -> str:
        return (
            f"Operario(codigo='{self._codigo}', nombre='{self._nombre}', "
            f"velocidad={self._velocidad.m_por_segundo}m/s, "
            f"tiempo_acumulado={self._tiempo_acumulado}min)"
        )