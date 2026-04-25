from typing import Any

from core.utils import UnidadDistancia
from ..interfaces.Grafo import Grafo
from ..infrastructure.Pedido import Pedido
from ..infrastructure.Producto import Producto
from ..utils.UnidadDistancia import UnidadDistancia


class TSP:
    """
    Resuelve el problema del viajante (TSP) usando la heurística
    del vecino más cercano sobre un grafo de ubicaciones.

    Se construye con un Grafo y el código del nodo depósito
    (punto de inicio y fin del recorrido).
    """

    def __init__(self, grafo: Grafo, deposito: str):
        if not isinstance(grafo, Grafo):
            raise ValueError(f"Se esperaba un Grafo, se recibió: {type(grafo)}")
        if deposito not in grafo.nodos():
            raise ValueError(f"El depósito '{deposito}' no existe en el grafo")
        self._grafo = grafo
        self._deposito = deposito

    def calcular(self, batch: set[Pedido]) -> UnidadDistancia:
        """
        Calcula la distancia total del recorrido para un batch de pedidos,
        saliendo y volviendo al depósito.
        """
        if not isinstance(batch, set):
            raise ValueError("El batch debe ser un conjunto (set) de Pedido")

        nodos_a_visitar = set()
        for pedido in batch:
            if not isinstance(pedido, Pedido):
                raise ValueError(f"Todos los elementos del batch deben ser Pedido, se recibió: {type(pedido)}")
            for producto in pedido.productos():
                nodos_a_visitar.add(producto.codigo)

        return self._calcular_desde_nodos(nodos_a_visitar)

    def calcular_desde_productos(self, productos: dict[Producto, int]) -> UnidadDistancia:
        """
        Calcula la distancia desde un dict de productos.
        """
        nodos_a_visitar = {p.codigo for p in productos.keys()}
        return self._calcular_desde_nodos(nodos_a_visitar)

    def distancia_hasta_deposito(self, productos: set[Producto]) -> UnidadDistancia:
        """
        Calcula la distancia desde el último producto hasta el depósito.
        """
        if not productos:
            return UnidadDistancia(0.0)
        ultimo = max(productos, key=lambda p: 0)
        return self._grafo.distancia(ultimo.codigo, self._deposito)

    def _calcular_desde_nodos(self, nodos: set[str]) -> UnidadDistancia | tuple[UnidadDistancia, list[Any]]:
        """Calcula la distancia desde un set de códigos de nodos."""
        if not nodos:
            return UnidadDistancia(0.0)

        nodos_invalidos = nodos - self._grafo.nodos()
        if nodos_invalidos:
            raise ValueError(f"Los siguientes nodos no existen en el grafo: {nodos_invalidos}")

        pendientes = set(nodos)
        posicion_actual = self._deposito
        distancia_total = 0.0

        secuencia :list(str) = []
        secuencia.append(posicion_actual)

        while pendientes:
            #Selecciona el producto pendiente a distancia minima entre posicion actual
            siguiente = min(pendientes, key=lambda n: self._grafo.distancia(posicion_actual, n).metros)
            #suma diferencia de distancia
            distancia_total += self._grafo.distancia(posicion_actual, siguiente).metros
            #cambia posicion actual al ultimo producto
            posicion_actual = siguiente
            secuencia.append(posicion_actual)
            #saca de la lista de pendientes al producto sumado
            pendientes.remove(siguiente)

        distancia_total += self._grafo.distancia(posicion_actual, self._deposito).metros

        secuencia.append(self._deposito)

        return UnidadDistancia(distancia_total), secuencia