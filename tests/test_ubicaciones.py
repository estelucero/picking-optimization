import pytest

from core.infrastructure.Producto import Producto
from core.infrastructure.Ubicaciones import Ubicaciones
from core.utils.UnidadDistancia import UnidadDistancia


@pytest.fixture
def productos():
    return [
        Producto("DEPOSITO", "Deposito", 1.0, 0, 0),
        Producto("SKU-001", "Silla", 8.0, 3, 0),
        Producto("SKU-002", "Monitor", 4.0, 3, 4),
        Producto("SKU-003", "Teclado", 2.0, 6, 4),
    ]


@pytest.fixture
def grafo(productos):
    return Ubicaciones(productos)


class TestUbicacionesConstruccion:
    def test_construccion_valida(self, productos):
        grafo = Ubicaciones(productos)
        assert len(grafo.nodos()) == len(productos)

    def test_lista_vacia_lanza_error(self):
        with pytest.raises(ValueError, match="no vac"):
            Ubicaciones([])

    def test_no_es_lista_lanza_error(self):
        with pytest.raises(ValueError):
            Ubicaciones("no es lista")

    def test_producto_duplicado_lanza_error(self):
        productos = [
            Producto("SKU-001", "Silla", 8.0, 0, 0),
            Producto("SKU-001", "Otra Silla", 5.0, 1, 1),
        ]
        with pytest.raises(ValueError, match="duplicado"):
            Ubicaciones(productos)

    def test_elemento_no_es_producto_lanza_error(self):
        with pytest.raises(ValueError):
            Ubicaciones(["no es producto"])


class TestUbicacionesMetodos:
    def test_nodos_retorna_todos_los_codigos(self, productos, grafo):
        nodos = grafo.nodos()
        codigos_esperados = {p.codigo for p in productos}

        assert nodos == codigos_esperados

    def test_distancia_manhattan_horizontal(self, productos, grafo):
        distancia = grafo.distancia("SKU-001", "DEPOSITO")
        esperado = abs(3 - 0) + abs(0 - 0)

        assert distancia.metros == esperado

    def test_distancia_manhattan_vertical(self, productos, grafo):
        distancia = grafo.distancia("SKU-003", "DEPOSITO")
        esperado = abs(6 - 0) + abs(4 - 0)

        assert distancia.metros == esperado

    def test_distancia_manhattan_diagonal(self, productos, grafo):
        distancia = grafo.distancia("SKU-002", "SKU-003")
        esperado = abs(3 - 6) + abs(4 - 4)

        assert distancia.metros == esperado

    def test_distancia_origen_inexistente_lanza_error(self, grafo):
        with pytest.raises(ValueError, match="no existe en el grafo"):
            grafo.distancia("NO-EXISTE", "SKU-001")

    def test_distancia_destino_inexistente_lanza_error(self, grafo):
        with pytest.raises(ValueError, match="No existe distancia"):
            grafo.distancia("SKU-001", "NO-EXISTE")

    def test_producto_retorna_producto_correcto(self, productos, grafo):
        producto = grafo.producto("SKU-001")

        assert producto.codigo == "SKU-001"
        assert producto.nombre == "Silla"
        assert producto.peso == 8.0

    def test_producto_codigo_inexistente_lanza_error(self, grafo):
        with pytest.raises(ValueError, match="No existe un producto"):
            grafo.producto("NO-EXISTE")


class TestUbicacionesSimetria:
    def test_distancia_es_simetrica(self, productos, grafo):
        d1 = grafo.distancia("SKU-001", "SKU-002")
        d2 = grafo.distancia("SKU-002", "SKU-001")

        assert d1 == d2

    def test_distancia_a_si_mismo_no_existe(self, productos, grafo):
        assert "SKU-001" not in grafo._distancias["SKU-001"]
