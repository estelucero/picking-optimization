from ..interfaces.Grafo import Grafo
from ..infrastructure.Pedido import Pedido
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

        Junta todas las ubicaciones de todos los pedidos del batch,
        elimina duplicados y aplica vecino más cercano.

        Parámetros:
        - batch: conjunto de Pedido a visitar en este viaje

        Retorna:
        - UnidadDistancia con la distancia total del recorrido (en metros)
        """
        if not isinstance(batch, set):
            raise ValueError("El batch debe ser un conjunto (set) de Pedido")

        nodos_a_visitar = set()
        for pedido in batch:
            if not isinstance(pedido, Pedido):
                raise ValueError(f"Todos los elementos del batch deben ser Pedido, se recibió: {type(pedido)}")
            for producto in pedido.productos():
                nodos_a_visitar.add(producto.codigo)

        if not nodos_a_visitar:
            return UnidadDistancia(0.0)

        nodos_invalidos = nodos_a_visitar - self._grafo.nodos()
        if nodos_invalidos:
            raise ValueError(f"Los siguientes nodos no existen en el grafo: {nodos_invalidos}")

        pendientes = set(nodos_a_visitar)
        posicion_actual = self._deposito
        distancia_total = 0.0

        while pendientes:
            siguiente = min(pendientes, key=lambda n: self._grafo.distancia(posicion_actual, n).metros)
            distancia_total += self._grafo.distancia(posicion_actual, siguiente).metros
            posicion_actual = siguiente
            pendientes.remove(siguiente)

        distancia_total += self._grafo.distancia(posicion_actual, self._deposito).metros

        return UnidadDistancia(distancia_total)