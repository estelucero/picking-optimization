from .Producto import Producto


class Viaje:
    """
    Representa un viaje realizado por un operario en su carro de picking.

    Atributos:
    - productos: diccionario {Producto: cantidad} con los productos recogidos
    - distancia: distancia total recorrida en metros
    - tiempo: tiempo total del viaje en minutos
    """

    def __init__(
        self,
        productos: dict[Producto, int],
        distancia: float,
        tiempo: float,
        secuencia: list[str],
        pesoTotal: float,
    ):
        if not isinstance(productos, dict) or len(productos) == 0:
            raise ValueError("El viaje debe tener al menos un producto")
        if not isinstance(distancia, (int, float)) or distancia < 0:
            raise ValueError(f"La distancia debe ser un número no negativo, se recibió: {distancia}")
        if not isinstance(tiempo, (int, float)) or tiempo < 0:
            raise ValueError(f"El tiempo debe ser un número no negativo, se recibió: {tiempo}")

        self._productos = dict(productos)
        self._distancia = float(distancia)
        self._tiempo = float(tiempo)
        self._secuencia = secuencia
        self._pesoTotal = pesoTotal

    @property
    def productos(self) -> dict[Producto, int]:
        return dict(self._productos)

    @property
    def distancia(self) -> float:
        return self._distancia

    @property
    def tiempo(self) -> float:
        return self._tiempo

    def secuencia(self) -> list[str]:
        """Retorna la secuancia de productos batch actual."""
        return self._secuencia

    def pesoTotal(self) -> float:
        """Retorna la secuancia de productos batch actual."""
        return self._pesoTotal

    def total_items(self) -> int:
        """Cantidad total de ítems en el viaje."""
        return sum(self._productos.values())

    def __repr__(self) -> str:
        return f"Viaje(productos={len(self._productos)}, distancia={self._distancia}m, tiempo={self._tiempo}min), pesoTotal={self._pesoTotal})"