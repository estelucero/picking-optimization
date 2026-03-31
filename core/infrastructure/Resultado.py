from .Operario import Operario
from .Pedido import Pedido


class Resultado:
    """
    Encapsula el resultado de ejecutar una heurística.

    Atributos:
    - tiempo_minimo: tiempo total de caminos minimos de todos los operarios (en minutos)
    - asignacion: dict {Operario: list[set[Pedido]]} con los batches de cada operario
    - secuencia: lista de pedidos en el orden en que fueron procesados
    """

    def __init__(
        self,
        tiempo_minimo: float,
        asignacion: dict[Operario, list[set[Pedido]]],
        secuencia: list[Pedido]
    ):
        self._validar_tiempo_minimo(tiempo_minimo)

        self._tiempo_minimo = tiempo_minimo
        self._asignacion = asignacion
        self._secuencia = secuencia

    def _validar_tiempo_minimo(self, tiempo_minimo: float) -> None:
        if not isinstance(tiempo_minimo, (int, float)) or tiempo_minimo < 0:
            raise ValueError(f"tiempo_minimo debe ser un número no negativo (en minutos), se recibió: {tiempo_minimo}")

    def _validar_asignacion(self, asignacion: dict) -> None:
        if not isinstance(asignacion, dict) or len(asignacion) == 0:
            raise ValueError("La asignación debe ser un diccionario no vacío")
        for operario, batches in asignacion.items():
            if not isinstance(operario, Operario):
                raise ValueError(f"Las claves deben ser Operario, se recibió: {type(operario)}")
            if not isinstance(batches, list):
                raise ValueError(f"Los batches del operario '{operario.codigo}' deben ser una lista")

    def _validar_secuencia(self, secuencia: list) -> None:
        if not isinstance(secuencia, list):
            raise ValueError("La secuencia debe ser una lista de Pedido")
        for p in secuencia:
            if not isinstance(p, Pedido):
                raise ValueError(f"Los elementos de la secuencia deben ser Pedido, se recibió: {type(p)}")

    @property
    def tiempo_minimo(self) -> float:
        return self._tiempo_minimo

    @property
    def asignacion(self) -> dict[Operario, list[set[Pedido]]]:
        return dict(self._asignacion)

    @property
    def secuencia(self) -> list[Pedido]:
        return list(self._secuencia)

    def __repr__(self) -> str:
        return (
            f"Resultado(tiempo_minimo={self._tiempo_minimo:.2f} min, "
            f"operarios={len(self._asignacion)}, "
            f"pedidos={len(self._secuencia)})"
        )