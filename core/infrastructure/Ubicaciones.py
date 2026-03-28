from producto import Producto
from grafo import Grafo


class Ubicaciones(Grafo):
    """
    Implementación concreta de Grafo que construye automáticamente
    la matriz de distancias Manhattan a partir de una lista de productos.

    Cada producto es un nodo. Las distancias entre nodos se calculan
    con la fórmula Manhattan: |x1 - x2| + |y1 - y2|.

    Ejemplo:
        productos = [
            Producto("SKU-001", "Silla", 8.5, 0, 0),
            Producto("SKU-002", "Monitor", 4.2, 3, 4),
        ]
        grafo = Ubicaciones(productos)
    """

    def __init__(self, productos: list[Producto]):
        self._validar(productos)
        self._productos: dict[str, Producto] = {p.codigo: p for p in productos}
        self._distancias: dict[str, dict[str, float]] = self._construir_grafo(productos)

    def _validar(self, productos: list[Producto]) -> None:
        if not isinstance(productos, list) or len(productos) == 0:
            raise ValueError("Se debe proveer una lista no vacía de productos")
        for p in productos:
            if not isinstance(p, Producto):
                raise ValueError(f"Todos los elementos deben ser Producto, se recibió: {type(p)}")
        codigos = [p.codigo for p in productos]
        if len(codigos) != len(set(codigos)):
            raise ValueError("Existen productos con código duplicado en la lista")

    def _construir_grafo(self, productos: list[Producto]) -> dict[str, dict[str, float]]:
        distancias = {}
        for origen in productos:
            distancias[origen.codigo] = {}
            for destino in productos:
                if origen.codigo != destino.codigo:
                    distancias[origen.codigo][destino.codigo] = self._manhattan(origen, destino)
        return distancias

    def _manhattan(self, origen: Producto, destino: Producto) -> float:
        return abs(origen.x - destino.x) + abs(origen.y - destino.y)

    def distancia(self, origen: str, destino: str) -> float:
        if origen not in self._distancias:
            raise ValueError(f"El nodo origen '{origen}' no existe en el grafo")
        if destino not in self._distancias[origen]:
            raise ValueError(f"No existe distancia entre '{origen}' y '{destino}'")
        return self._distancias[origen][destino]

    def nodos(self) -> set:
        return set(self._distancias.keys())

    def producto(self, codigo: str) -> Producto:
        if codigo not in self._productos:
            raise ValueError(f"No existe un producto con código '{codigo}'")
        return self._productos[codigo]

    def __repr__(self) -> str:
        nodos = sorted(self.nodos())
        return (
            f"Ubicaciones(\n"
            f"  nodos={nodos},\n"
            f"  total_aristas={sum(len(v) for v in self._distancias.values())}\n)"
        )