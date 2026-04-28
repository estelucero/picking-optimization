import pytest

from core.infrastructure.Producto import Producto
from core.infrastructure.Ubicaciones import Ubicaciones
from core.infrastructure.Pedido import Pedido
from core.algoritmos.Tsp import TSP
from core.utils.UnidadDistancia import UnidadDistancia


@pytest.fixture
def productos():
    return [
        Producto(codigo="DEPOSITO", nombre="Deposito", peso=1.0, x=0, y=0),
        Producto(codigo="SKU-001", nombre="Silla", peso=8.0, x=3, y=0),
        Producto(codigo="SKU-002", nombre="Monitor", peso=4.0, x=3, y=4),
        Producto(codigo="SKU-003", nombre="Teclado", peso=2.0, x=6, y=4),
        Producto(codigo="SKU-004", nombre="Lampara", peso=3.0, x=6, y=0),
    ]


@pytest.fixture
def grafo(productos):
    return Ubicaciones(productos=productos)


@pytest.fixture
def tsp(grafo):
    return TSP(grafo=grafo, deposito="DEPOSITO")


class TestTspConstruccion:
    def test_construccion_valida(self, grafo):
        tsp = TSP(grafo=grafo, deposito="DEPOSITO")
        assert tsp.grafo is grafo
        assert tsp.deposito == "DEPOSITO"

    def test_no_es_grafo_lanza_error(self):
        class NoEsGrafo:
            pass

        with pytest.raises(Exception):
            TSP(grafo=NoEsGrafo(), deposito="TEST")

    def test_deposito_no_existe_lanza_error(self, grafo):
        with pytest.raises(ValueError, match="no existe"):
            TSP(grafo=grafo, deposito="NO-EXISTE")


class TestTspCalcular:
    def test_batch_vacio_retorna_cero(self, tsp):
        resultado = tsp.calcular(set())
        assert resultado == UnidadDistancia(metros=0.0)

    def test_batch_lista_vacia_retorna_cero(self, tsp):
        resultado = tsp.calcular([])
        assert resultado == UnidadDistancia(metros=0.0)

    def test_nodos_no_existen_en_grafo_lanza_error(self, tsp, productos):
        prod_invalido = Producto(codigo="INVALIDO", nombre="Invalido", peso=1.0, x=0, y=0)
        pedido = Pedido(codigo="PED-1", cliente="Cliente", items={prod_invalido: 1})

        with pytest.raises(ValueError, match="no existen"):
            tsp.calcular({pedido})

    def test_batch_un_solo_nodo_retorna_distancia_correcta(self, tsp, productos):
        sku001 = next(p for p in productos if p.codigo == "SKU-001")
        pedido = Pedido(codigo="PED-1", cliente="Cliente", items={sku001: 1})

        distancia = tsp.calcular({pedido})
        distancia_esperada = tsp.grafo.distancia("DEPOSITO", "SKU-001").metros + \
                            tsp.grafo.distancia("SKU-001", "DEPOSITO").metros

        assert distancia.metros == distancia_esperada

    def test_batch_multiple_nodos_retorna_distancia_positiva(self, tsp, productos):
        sku001 = next(p for p in productos if p.codigo == "SKU-001")
        sku002 = next(p for p in productos if p.codigo == "SKU-002")
        pedidos = {
            Pedido(codigo="PED-1", cliente="Cliente", items={sku001: 1}),
            Pedido(codigo="PED-2", cliente="Cliente", items={sku002: 1}),
        }

        distancia = tsp.calcular(pedidos)

        assert distancia.metros > 0

    def test_distancia_total_siempre_positiva(self, tsp, productos):
        sku001 = next(p for p in productos if p.codigo == "SKU-001")
        pedido = Pedido(codigo="PED-1", cliente="Cliente", items={sku001: 1})

        distancia = tsp.calcular({pedido})

        assert distancia.metros > 0

    def test_pedidos_duplicados_mismo_producto_cuenta_una_vez(self, tsp, productos):
        sku001 = next(p for p in productos if p.codigo == "SKU-001")
        pedido1 = Pedido(codigo="PED-1", cliente="Cliente", items={sku001: 1})
        pedido2 = Pedido(codigo="PED-2", cliente="Cliente", items={sku001: 2})

        distancia_un_pedido = tsp.calcular({pedido1})
        distancia_dos_pedidos = tsp.calcular({pedido1, pedido2})

        assert distancia_un_pedido.metros == distancia_dos_pedidos.metros

    def test_calcular_desde_productos_retorna_secuencia(self, tsp, productos):
        sku001 = next(p for p in productos if p.codigo == "SKU-001")
        distancia, secuencia = tsp.calcular_desde_productos({sku001: 1})

        assert distancia.metros > 0
        assert secuencia[0] == "DEPOSITO"
        assert secuencia[-1] == "DEPOSITO"
