from .Operario import Operario
from .Pedido import Pedido
from .Producto import Producto
from .Viaje import Viaje


class Resultado:
    """
    Encapsula el resultado de ejecutar una heurística.

    Atributos:
    - tiempo_minimo: tiempo total de caminos minimos de todos los operarios (en minutos)
    - asignacion: dict {Operario: list[Viaje]} con los viajes de cada operario
    - secuencia: lista de productos en el orden en que fueron procesados
    """

    def __init__(
        self,
        tiempo_minimo: float,
        asignacion: dict[Operario, list[Viaje]],
        secuencia: list[Producto]
    ):
        self._validar_tiempo_minimo(tiempo_minimo)

        self._tiempo_minimo = tiempo_minimo
        self._asignacion = asignacion
        self._secuencia = secuencia

    def _validar_tiempo_minimo(self, tiempo_minimo: float) -> None:
        if not isinstance(tiempo_minimo, (int, float)) or tiempo_minimo < 0:
            raise ValueError(f"tiempo_minimo debe ser un número no negativo (en minutos), se recibió: {tiempo_minimo}")

    @property
    def tiempo_minimo(self) -> float:
        return self._tiempo_minimo

    @property
    def asignacion(self) -> dict[Operario, list[Viaje]]:
        return dict(self._asignacion)

    @property
    def secuencia(self) -> list[Producto]:
        return list(self._secuencia)

    def __repr__(self) -> str:
        return (
            f"Resultado(tiempo_minimo={self._tiempo_minimo:.2f} min, "
            f"operarios={len(self._asignacion)}, "
            f"productos={len(self._secuencia)})"
        )