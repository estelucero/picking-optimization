import pytest

from core.infrastructure.Producto import Producto
from core.infrastructure.Pedido import Pedido


@pytest.fixture
def producto():
    return Producto(codigo="SKU-001", nombre="Silla", peso=8.0, x=3, y=0)


class TestPedidoConstruccion:
    def test_codigo_vacio_lanza_error(self, producto):
        with pytest.raises(ValueError):
            Pedido(codigo="", cliente="Cliente", items={producto: 1})

    def test_codigo_solo_espacios_lanza_error(self, producto):
        with pytest.raises(ValueError):
            Pedido(codigo="   ", cliente="Cliente", items={producto: 1})

    def test_cliente_vacio_lanza_error(self, producto):
        with pytest.raises(ValueError):
            Pedido(codigo="PED-001", cliente="", items={producto: 1})

    def test_items_vacios_lanza_error(self):
        with pytest.raises(ValueError):
            Pedido(codigo="PED-001", cliente="Cliente", items={})

    def test_items_no_es_dict_lanza_error(self):
        with pytest.raises(ValueError):
            Pedido(codigo="PED-001", cliente="Cliente", items="no es dict")

    def test_clave_no_es_producto_lanza_error(self):
        with pytest.raises(ValueError):
            Pedido(codigo="PED-001", cliente="Cliente", items={"SKU-001": 1})

    def test_cantidad_cero_lanza_error(self, producto):
        with pytest.raises(ValueError, match="inv.lida"):
            Pedido(codigo="PED-001", cliente="Cliente", items={producto: 0})

    def test_cantidad_negativa_lanza_error(self, producto):
        with pytest.raises(ValueError, match="inv.lida"):
            Pedido(codigo="PED-001", cliente="Cliente", items={producto: -1})


class TestPedidoPropiedades:
    def test_codigo_retorna_valor_correcto(self, producto):
        pedido = Pedido(codigo="PED-001", cliente="Cliente", items={producto: 1})

        assert pedido.codigo == "PED-001"

    def test_cliente_retorna_valor_correcto(self, producto):
        pedido = Pedido(codigo="PED-001", cliente="Juan Perez", items={producto: 1})

        assert pedido.cliente == "Juan Perez"

    def test_items_retorna_dict(self, producto):
        pedido = Pedido(codigo="PED-001", cliente="Cliente", items={producto: 2})

        items = pedido.items

        assert isinstance(items, dict)
        assert items[producto] == 2


class TestPedidoMetodos:
    def test_total_items_sin_cantidades(self, producto):
        pedido = Pedido(codigo="PED-001", cliente="Cliente", items={producto: 1})

        assert pedido.total_items() == 1

    def test_total_items_con_cantidades_multiples(self, producto):
        otro_producto = Producto(codigo="SKU-002", nombre="Mesa", peso=5.0, x=0, y=0)
        pedido = Pedido(codigo="PED-001", cliente="Cliente", items={producto: 3, otro_producto: 2})

        assert pedido.total_items() == 5

    def test_productos_retorna_set_de_productos(self, producto):
        otro_producto = Producto(codigo="SKU-002", nombre="Mesa", peso=5.0, x=0, y=0)
        pedido = Pedido(codigo="PED-001", cliente="Cliente", items={producto: 3, otro_producto: 2})

        productos = pedido.productos()

        assert isinstance(productos, set)
        assert producto in productos
        assert otro_producto in productos
        assert len(productos) == 2


class TestPedidoIgualdad:
    def test_dos_pedidos_mismo_codigo_son_iguales(self, producto):
        pedido1 = Pedido(codigo="PED-001", cliente="Cliente1", items={producto: 1})
        pedido2 = Pedido(codigo="PED-001", cliente="Cliente2", items={producto: 2})

        assert pedido1 == pedido2

    def test_dos_pedidos_diferente_codigo_no_son_iguales(self, producto):
        pedido1 = Pedido(codigo="PED-001", cliente="Cliente", items={producto: 1})
        pedido2 = Pedido(codigo="PED-002", cliente="Cliente", items={producto: 1})

        assert pedido1 != pedido2

    def test_pedido_no_es_igual_a_string(self, producto):
        pedido = Pedido(codigo="PED-001", cliente="Cliente", items={producto: 1})

        assert pedido != "PED-001"

    def test_pedidos_mismo_codigo_tienen_mismo_hash(self, producto):
        pedido1 = Pedido(codigo="PED-001", cliente="Cliente1", items={producto: 1})
        pedido2 = Pedido(codigo="PED-001", cliente="Cliente2", items={producto: 2})

        assert hash(pedido1) == hash(pedido2)


class TestPedidoRepresentacion:
    def test_repr_contiene_codigo(self, producto):
        pedido = Pedido(codigo="PED-001", cliente="Cliente", items={producto: 1})

        repr_str = repr(pedido)

        assert "PED-001" in repr_str
        assert "Cliente" in repr_str
