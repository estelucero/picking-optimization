from pydantic import BaseModel, Field, model_validator
from typing import Set, Dict, List, Optional
from typing import Any

from core.utils import UnidadDistancia
from ..interfaces.Grafo import Grafo
from ..infrastructure.Pedido import Pedido
from ..infrastructure.Producto import Producto
from ..utils.UnidadDistancia import UnidadDistancia


class TSP(BaseModel):
    """
    Resuelve el problema del viajante (TSP) usando la heurística
    del vecino más cercano sobre un grafo de ubicaciones.

    Se construye con un Grafo y el código del nodo depósito
    (punto de inicio y fin del recorrido).
    """

    grafo: Grafo
    deposito: str = Field(..., description="Código del nodo depósito (inicio/fin)")

    @model_validator(mode='after')
    def validar_deposito_engrafo(self) -> 'TSP':
        if self.deposito not in self.grafo.nodos():
            raise ValueError(f"El depósito '{self.deposito}' no existe en el grafo proporcionado.")
        return self


    def calcular(self, batch: set[Pedido]) -> UnidadDistancia:
        """
        Calcula la distancia total del recorrido para un batch de pedidos,
        saliendo y volviendo al depósito.
        """
        nodos_a_visitar = set()
        for pedido in batch:
            for producto in pedido.productos():
                nodos_a_visitar.add(producto.codigo)

        distancia, _ = self._calcular_desde_nodos(nodos_a_visitar)
        return distancia

    def calcular_desde_productos(self, productos: dict[Producto, int]) -> tuple[UnidadDistancia, list[Any]]:
        """
        Calcula la distancia desde un dict de productos.
        Retorna tupla (distancia, secuencia).
        """
        nodos_a_visitar = {p.codigo for p in productos.keys()}
        return self._calcular_desde_nodos(nodos_a_visitar)

    def distancia_hasta_deposito(self, productos: set[Producto]) -> UnidadDistancia:
        """
        Calcula la distancia desde el último producto hasta el depósito.
        """
        if not productos:
            return UnidadDistancia(metros=0.0)
        ultimo = max(productos, key=lambda p: 0)
        return self.grafo.distancia(ultimo.codigo, self.deposito)

    def _calcular_desde_nodos(self, nodos: set[str]) -> tuple[UnidadDistancia, list[Any]]:
        """Calcula la distancia desde un set de cdigos de nodos."""
        if not nodos:
            return UnidadDistancia(metros=0.0), []

        nodos_invalidos = nodos - self.grafo.nodos()
        if nodos_invalidos:
            raise ValueError(f"Los siguientes nodos no existen en el grafo: {nodos_invalidos}")

        pendientes = set(nodos)
        posicion_actual = self.deposito
        distancia_total = 0.0

        secuencia :List[str] = []
        secuencia.append(posicion_actual)

        while pendientes:
            #Selecciona el producto pendiente a distancia minima entre posicion actual
            siguiente = min(pendientes, key=lambda n: self.grafo.distancia(posicion_actual, n).metros)
            #suma diferencia de distancia
            distancia_total += self.grafo.distancia(posicion_actual, siguiente).metros
            #cambia posicion actual al ultimo producto
            posicion_actual = siguiente
            secuencia.append(posicion_actual)
            #saca de la lista de pendientes al producto sumado
            pendientes.remove(siguiente)

        distancia_total += self.grafo.distancia(posicion_actual, self.deposito).metros

        secuencia.append(self.deposito)

        return UnidadDistancia(metros=distancia_total), secuencia