from pydantic import BaseModel, Field, model_validator, PrivateAttr
from typing import Self
from .Producto import Producto
from ..interfaces.Grafo import Grafo
from ..utils.UnidadDistancia import UnidadDistancia


class Interseccion:
    id: str
    x: int
    y: int

class Ubicaciones(Grafo):
    """
    Implementación concreta de Grafo que construye automáticamente
    la matriz de distancias Manhattan a partir de una lista de productos.

    Cada producto es un nodo. Las distancias entre nodos se calculan
    con la fórmula Manhattan: |x1 - x2| + |y1 - y2| (en metros).

    Ejemplo:
        productos = [
            Producto("SKU-001", "Silla", 8.5, 0, 0),
            Producto("SKU-002", "Monitor", 4.2, 3, 4),
        ]
        grafo = Ubicaciones(productos)
    """
    # Pydantic valida automáticamente que sea una lista de Producto
    productos: list[Producto] = Field(
        ..., 
        min_length=1, 
        description="Lista no vacía de productos para construir el grafo"
    )

    # Atributos internos que no se serializan ni exponen en el schema
    _productos: dict[str, Producto] = PrivateAttr(default_factory=dict)
    #* Matriz de distancia de x producto a y producto
    _distancias: dict[str, dict[str, UnidadDistancia]] = PrivateAttr(default_factory=dict)

    @model_validator(mode='after')
    def _validar_y_construir(self) -> Self:
        # 1. Validar códigos únicos
        codigos = [p.codigo for p in self.productos]
        if len(codigos) != len(set(codigos)):
            raise ValueError("Existen productos con código duplicado en la lista")

        # 2. Construir estructuras internas
        self._productos = {p.codigo: p for p in self.productos}
        self._distancias = {}

        for origen in self.productos:
            self._distancias[origen.codigo] = {}
            for destino in self.productos:
                if origen.codigo != destino.codigo:
                    #calculo de distancia
                    # metros = self._manhattan(origen, destino)
                    #TODO: reemplazar calculo por distancia entre origen y interseccion + distancia detino y interseccion + distancia entre intersecciones

                    metros = 0

                    #Si estan en el mismo pasillo
                    if(origen.x == destino.x and origen.y == destino.y):
                        metros = self._manhattan(origen, destino)
                    else:
                        #Buscar interseccion mas conveniente

                        inter_origen = self._mejor_interseccion(
                            producto=origen,
                            objetivo=destino
                        )

                        inter_destino = self._mejor_interseccion(
                            producto=destino,
                            objetivo=origen
                        )

                        #distancia entre origen y mejor interseccion
                        d1 = self._manhattan(origen, inter_origen)

                        #distancia entre intersecciones
                        d2 = self._manhattan(inter_origen, inter_destino)

                        #distancia entre interseccion y destino
                        d3 = self._manhattan(inter_destino, destino)

                        metros = d1 + d2 + d3

                    self._distancias[origen.codigo][destino.codigo] = UnidadDistancia(metros=metros)
                    
        return self

    def _manhattan(self, origen: Producto, destino: Producto) -> float:
        return abs(origen.x - destino.x) + abs(origen.y - destino.y)

    def _mejor_interseccion(
            self,
            producto: Producto,
            objetivo: Producto
    ) -> Interseccion:

        intersecciones = [
            i
            for i in self.intersecciones
            if i.y == producto.y
        ]

        return min(
            intersecciones,
            key=lambda inter: self._manhattan(inter, objetivo)
        )

    def generar_intersecciones(
            calles_verticales: int,
            calles_horizontales: int,
            estanterias_por_calle: int
    ) -> list[Interseccion]:

        separacion = estanterias_por_calle + 1

        intersecciones = []

        for vx in range(calles_verticales):

            x = vx * separacion + estanterias_por_calle

            for hy in range(calles_horizontales):
                y = hy * separacion + estanterias_por_calle

                intersecciones.append(
                    Interseccion(x=x, y=y)
                )

        return intersecciones

    def distancia(self, origen: str, destino: str) -> UnidadDistancia:
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