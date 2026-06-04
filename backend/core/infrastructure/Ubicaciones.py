from pydantic import BaseModel, Field, computed_field, model_validator, PrivateAttr
from typing import Self
from .Producto import Producto
from ..interfaces.Grafo import Grafo
from ..utils.UnidadDistancia import UnidadDistancia


class Coordenada(BaseModel):
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
    calles_verticales: int = Field(..., gt=0)
    calles_horizontales: int = Field(..., gt=0)
    estanterias_por_calle: int = Field(..., gt=0)

    # Atributos internos que no se serializan ni exponen en el schema
    _productos: dict[str, Producto] = PrivateAttr(default_factory=dict)
    #* Matriz de distancia de x producto a y producto
    _distancias: dict[str, dict[str, UnidadDistancia]] = PrivateAttr(default_factory=dict)

    ancho_estanteria: float = 1.0
    ancho_calle_horizontal: float = 2.0
    alto_calle_vertical: float = 4

    @model_validator(mode='after')
    def _validar_y_construir(self) -> Self:
        # 1. Validar códigos únicos
        codigos = [p.codigo for p in self.productos]
        if len(codigos) != len(set(codigos)):
            raise ValueError("Existen productos con código duplicado en la lista")

        # 2. Construir estructuras internas
        self._productos = {p.codigo: p for p in self.productos}
        self._distancias = {}

        intersecciones: list[Coordenada] = self.generar_intersecciones(calles_verticales=self.calles_verticales,
                                                                       calles_horizontales=self.calles_horizontales,
                                                                       estanterias_por_calle=self.estanterias_por_calle)

        for origen in self.productos:
            self._distancias[origen.codigo] = {}
            for destino in self.productos:
                if origen.codigo != destino.codigo:
                    #calculo de distancia
                    # metros = self._manhattan(origen, destino)
                    #TODO: reemplazar calculo por distancia entre origen y interseccion + distancia detino y interseccion + distancia entre intersecciones

                    metros = 0

                    #Si estan en el mismo pasillo
                    if self.mismo_pasillo(origen, destino):
                        metros = self.distancia_real_productos(origen, destino)
                    else:
                        #Buscar interseccion mas conveniente

                        inter_origen = self._mejor_interseccion(
                            origen=origen,
                            destino=destino,
                            intersec=intersecciones
                        )

                        #distancia entre origen y mejor interseccion
                        d1 = self.distancia_real(origen, inter_origen)

                        #Distancia entre la interseccion y el destino
                        d2 = self.distancia_real(destino, inter_origen)

                        metros = d1 + d2

                    self._distancias[origen.codigo][destino.codigo] = UnidadDistancia(metros=metros)
                    
        return self

    def posicion_real_x(self, x_logico: float) -> float:

        separacion = self.estanterias_por_calle + 1

        bloque = x_logico // separacion

        offset = x_logico % separacion

        ancho_bloque = ( self.estanterias_por_calle * self.ancho_estanteria )

        inicio_bloque = ( bloque * ( ancho_bloque + self.ancho_calle_horizontal ) )

        # Producto/picking
        if offset < self.estanterias_por_calle:

            return ( inicio_bloque + (offset * self.ancho_estanteria) + (self.ancho_estanteria / 2) )
        # Calle/intersección
        else:
            return ( inicio_bloque + ancho_bloque + (self.ancho_calle_horizontal / 2) )

    def posicion_real_y(self, y_logico: float) -> float:

        return (y_logico * self.alto_calle_vertical)

    def distancia_real(self, producto_a: Producto, interseccion: Coordenada) -> float:

        ax = self.posicion_real_x(producto_a.x)
        ay = self.posicion_real_y(producto_a.y)

        bx = self.posicion_real_x(interseccion.x)
        by = self.posicion_real_y(interseccion.y)

        return abs(ax - bx) + abs(ay - by)

    def distancia_real_productos(self, origen: Producto, destino: Producto) -> float:
        origen_x_real = self.posicion_real_x(origen.x)
        origen_y_real = self.posicion_real_y(origen.y)

        destino_x_real = self.posicion_real_x(destino.x)
        destino_y_real = self.posicion_real_y(destino.y)

        return abs(origen_x_real - destino_x_real) + abs(origen_y_real - destino_y_real)

    def _manhattan_Prod_Coord(self, origen: Producto, destino: Coordenada) -> float:
        return abs(origen.x - destino.x) + abs(origen.y - destino.y)

    def mismo_pasillo(
            self,
            origen: Producto,
            destino: Producto
    ) -> bool:

        # Deben estar en la misma fila
        if origen.y != destino.y:
            return False
        else:
            return True

    def _intersecciones_vecinas(
            self,
            producto: Producto,
            intersec: list[Coordenada]
    ) -> list[Coordenada]:

        separacion = self.estanterias_por_calle + 1

        bloque = producto.x // separacion

        calle_izquierda = bloque * separacion - 1
        calle_derecha = bloque * separacion + self.estanterias_por_calle

        resultado = []

        for i in intersec:

            if i.y != producto.y:
                continue

            if i.x == calle_izquierda or i.x == calle_derecha:
                resultado.append(i)

        return resultado

    def _mejor_interseccion(
            self,
            origen: Producto,
            destino: Producto,
            intersec: list[Coordenada]
    ) -> Coordenada:

        vecinas = self._intersecciones_vecinas(
            origen,
            intersec
        )

        return min(
            vecinas,
            key=lambda inter: self._manhattan_Prod_Coord(
                destino,
                inter
            )
        )

    def generar_intersecciones(
            self,
            calles_verticales: int,
            calles_horizontales: int,
            estanterias_por_calle: int
    ) -> list[Coordenada]:

        separacion = estanterias_por_calle + 1

        intersecciones = []

        for vx in range(calles_verticales):

            # calle vertical
            x = vx * separacion + estanterias_por_calle

            for hy in range(calles_horizontales):
                # calle horizontal
                y = hy * 1

                intersecciones.append(
                    Coordenada(x=x, y=y)
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

    @computed_field
    @property
    def distancias(self) -> dict[str, dict[str, UnidadDistancia]]:
        return self._distancias