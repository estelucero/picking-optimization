import pytest

from core.infrastructure.Producto import Producto
from core.infrastructure.Ubicaciones import Ubicaciones
from core.infrastructure.Pedido import Pedido
from core.algoritmos.Tsp import TSP
from core.utils.UnidadDistancia import UnidadDistancia


@pytest.fixture
def productos():
    return [
        Producto("DEPOSITO", "Deposito", 1.0, 0, 0),
        Producto("SKU-001", "Silla", 8.0, 3, 0),
        Producto("SKU-002", "Monitor", 4.0, 3, 4),
        Producto("SKU-003", "Teclado", 2.0, 6, 4),
        Producto("SKU-004", "Lampara", 3.0, 6, 0),
    ]


@pytest.fixture
def grafo(productos):
    return Ubicaciones(productos)


@pytest.fixture
def tsp(grafo):
    return TSP(grafo, deposito="DEPOSITO")


class TestTspConstruccion:
    def test_construccion_valida(self, grafo):
        tsp = TSP(grafo, deposito="DEPOSITO")
        assert tsp._grafo is grafo
        assert tsp._deposito == "DEPOSITO"

    def test_no_es_grafo_lanza_error(self):
        class NoEsGrafo:
            pass

        with pytest.raises(ValueError, match="Se esperaba un Grafo"):
            TSP(NoEsGrafo(), deposito="TEST")

    def test_deposito_no_existe_lanza_error(self, grafo):
        with pytest.raises(ValueError, match="no existe en el grafo"):
            TSP(grafo, deposito="NO-EXISTE")


class TestTspCalcular:
    def test_batch_vacio_retorna_cero(self, tsp):
        resultado = tsp.calcular(set())
        assert resultado == UnidadDistancia(0.0)

    def test_batch_no_es_set_lanza_error(self, tsp):
        with pytest.raises(ValueError, match="debe ser un conjunto"):
            tsp.calcular([])

    def test_elemento_no_es_pedido_lanza_error(self, tsp):
        with pytest.raises(ValueError, match="deben ser Pedido"):
            tsp.calcular({"no-es-pedido"})

    def test_nodos_no_existen_en_grafo_lanza_error(self, tsp, productos):
        prod_invalido = Producto("INVALIDO", "Invalido", 1.0, 0, 0)
        pedido = Pedido("PED-1", "Cliente", {prod_invalido: 1})

        with pytest.raises(ValueError, match="no existen en el grafo"):
            tsp.calcular({pedido})

    def test_batch_un_solo_nodo_retorna_distancia_correcta(self, tsp, productos):
        sku001 = next(p for p in productos if p.codigo == "SKU-001")
        pedido = Pedido("PED-1", "Cliente", {sku001: 1})

        distancia = tsp.calcular({pedido})
        distancia_esperada = tsp._grafo.distancia("DEPOSITO", "SKU-001").metros + \
                            tsp._grafo.distancia("SKU-001", "DEPOSITO").metros

        assert distancia.metros == distancia_esperada

    def test_batch_multiple_nodos_retorna_distancia_positiva(self, tsp, productos):
        sku001 = next(p for p in productos if p.codigo == "SKU-001")
        sku002 = next(p for p in productos if p.codigo == "SKU-002")
        pedidos = {
            Pedido("PED-1", "Cliente", {sku001: 1}),
            Pedido("PED-2", "Cliente", {sku002: 1}),
        }

        distancia = tsp.calcular(pedidos)

        assert distancia.metros > 0

    def test_distancia_total_siempre_positiva(self, tsp, productos):
        sku001 = next(p for p in productos if p.codigo == "SKU-001")
        pedido = Pedido("PED-1", "Cliente", {sku001: 1})

        distancia = tsp.calcular({pedido})

        assert distancia.metros > 0

    def test_pedidos_duplicados_mismo_producto_cuenta_una_vez(self, tsp, productos):
        sku001 = next(p for p in productos if p.codigo == "SKU-001")
        pedido1 = Pedido("PED-1", "Cliente", {sku001: 1})
        pedido2 = Pedido("PED-2", "Cliente", {sku001: 2})

        distancia_un_pedido = tsp.calcular({pedido1})
        distancia_dos_pedidos = tsp.calcular({pedido1, pedido2})

        assert distancia_un_pedido.metros == distancia_dos_pedidos.metros
