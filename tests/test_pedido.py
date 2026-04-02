import pytest

from core.infrastructure.Producto import Producto
from core.infrastructure.Pedido import Pedido


@pytest.fixture
def producto():
    return Producto("SKU-001", "Silla", 8.0, 3, 0)


class TestPedidoConstruccion:
    def test_codigo_vacio_lanza_error(self, producto):
        with pytest.raises(ValueError, match="c.digo"):
            Pedido("", "Cliente", {producto: 1})

    def test_codigo_solo_espacios_lanza_error(self, producto):
        with pytest.raises(ValueError, match="c.digo"):
            Pedido("   ", "Cliente", {producto: 1})

    def test_cliente_vacio_lanza_error(self, producto):
        with pytest.raises(ValueError, match="cliente"):
            Pedido("PED-001", "", {producto: 1})

    def test_items_vacios_lanza_error(self):
        with pytest.raises(ValueError, match="al menos un producto"):
            Pedido("PED-001", "Cliente", {})

    def test_items_no_es_dict_lanza_error(self):
        with pytest.raises(ValueError):
            Pedido("PED-001", "Cliente", "no es dict")

    def test_clave_no_es_producto_lanza_error(self):
        with pytest.raises(ValueError, match="Las claves deben ser Producto"):
            Pedido("PED-001", "Cliente", {"SKU-001": 1})

    def test_cantidad_cero_lanza_error(self, producto):
        with pytest.raises(ValueError, match="mayor a 0"):
            Pedido("PED-001", "Cliente", {producto: 0})

    def test_cantidad_negativa_lanza_error(self, producto):
        with pytest.raises(ValueError, match="mayor a 0"):
            Pedido("PED-001", "Cliente", {producto: -1})


class TestPedidoPropiedades:
    def test_codigo_retorna_valor_correcto(self, producto):
        pedido = Pedido("PED-001", "Cliente", {producto: 1})

        assert pedido.codigo == "PED-001"

    def test_cliente_retorna_valor_correcto(self, producto):
        pedido = Pedido("PED-001", "Juan Perez", {producto: 1})

        assert pedido.cliente == "Juan Perez"

    def test_items_retorna_dict(self, producto):
        pedido = Pedido("PED-001", "Cliente", {producto: 2})

        items = pedido.items

        assert isinstance(items, dict)
        assert items[producto] == 2


class TestPedidoMetodos:
    def test_total_items_sin_cantidades(self, producto):
        pedido = Pedido("PED-001", "Cliente", {producto: 1})

        assert pedido.total_items() == 1

    def test_total_items_con_cantidades_multiples(self, producto):
        otro_producto = Producto("SKU-002", "Mesa", 5.0, 0, 0)
        pedido = Pedido("PED-001", "Cliente", {producto: 3, otro_producto: 2})

        assert pedido.total_items() == 5

    def test_productos_retorna_set_de_productos(self, producto):
        otro_producto = Producto("SKU-002", "Mesa", 5.0, 0, 0)
        pedido = Pedido("PED-001", "Cliente", {producto: 3, otro_producto: 2})

        productos = pedido.productos()

        assert isinstance(productos, set)
        assert producto in productos
        assert otro_producto in productos
        assert len(productos) == 2


class TestPedidoIgualdad:
    def test_dos_pedidos_mismo_codigo_son_iguales(self, producto):
        pedido1 = Pedido("PED-001", "Cliente1", {producto: 1})
        pedido2 = Pedido("PED-001", "Cliente2", {producto: 2})

        assert pedido1 == pedido2

    def test_dos_pedidos_diferente_codigo_no_son_iguales(self, producto):
        pedido1 = Pedido("PED-001", "Cliente", {producto: 1})
        pedido2 = Pedido("PED-002", "Cliente", {producto: 1})

        assert pedido1 != pedido2

    def test_pedido_no_es_igual_a_string(self, producto):
        pedido = Pedido("PED-001", "Cliente", {producto: 1})

        assert pedido != "PED-001"

    def test_pedidos_mismo_codigo_tienen_mismo_hash(self, producto):
        pedido1 = Pedido("PED-001", "Cliente1", {producto: 1})
        pedido2 = Pedido("PED-001", "Cliente2", {producto: 2})

        assert hash(pedido1) == hash(pedido2)


class TestPedidoRepresentacion:
    def test_repr_contiene_codigo(self, producto):
        pedido = Pedido("PED-001", "Cliente", {producto: 1})

        repr_str = repr(pedido)

        assert "PED-001" in repr_str
        assert "Cliente" in repr_str
