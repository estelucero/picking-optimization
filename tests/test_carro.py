import pytest

from core.infrastructure.Producto import Producto
from core.infrastructure.Pedido import Pedido
from core.infrastructure.Carro import Carro


@pytest.fixture
def producto_liviano():
    return Producto("SKU-001", "Producto Liviano", 2.0, 0, 0)


@pytest.fixture
def producto_pesado():
    return Producto("SKU-002", "Producto Pesado", 5.0, 0, 0)


class TestCarroConstruccion:
    def test_capacidad_positiva_crea_carro(self):
        carro = Carro(20.0)
        assert carro.capacidad_max_peso == 20.0

    def test_capacidad_cero_lanza_error(self):
        with pytest.raises(ValueError, match="mayor a 0"):
            Carro(0)

    def test_capacidad_negativa_lanza_error(self):
        with pytest.raises(ValueError, match="mayor a 0"):
            Carro(-10)

    def test_capacidad_string_lanza_error(self):
        with pytest.raises(ValueError):
            Carro("diez")


class TestCarroAgregarPedido:
    def test_puede_agregar_pedido_dentro_capacidad(self, producto_liviano):
        carro = Carro(20.0)
        pedido = Pedido("PED-001", "Cliente", {producto_liviano: 1})

        assert carro.puede_agregar(pedido) is True

    def test_no_puede_agregar_pedido_que_supera_capacidad(self, producto_pesado):
        carro = Carro(3.0)
        pedido = Pedido("PED-001", "Cliente", {producto_pesado: 1})

        assert carro.puede_agregar(pedido) is False

    def test_agregar_pedido_crea_batch(self, producto_liviano):
        carro = Carro(20.0)
        pedido = Pedido("PED-001", "Cliente", {producto_liviano: 1})

        carro.agregar_pedido(pedido)

        assert carro.total_batches() == 1

    def test_agregar_pedido_supera_capacidad_lanza_error(self, producto_pesado):
        carro = Carro(3.0)
        pedido = Pedido("PED-001", "Cliente", {producto_pesado: 1})

        with pytest.raises(ValueError, match="supera por s"):
            carro.agregar_pedido(pedido)

    def test_abre_nuevo_batch_cuando_no_entra(self, producto_pesado, producto_liviano):
        carro = Carro(5.0)
        pedido1 = Pedido("PED-001", "Cliente", {producto_pesado: 1})
        pedido2 = Pedido("PED-002", "Cliente", {producto_liviano: 1})

        carro.agregar_pedido(pedido1)
        carro.agregar_pedido(pedido2)

        assert carro.total_batches() == 2

    def test_pedidos_juntos_cabecen_en_mismo_batch(self, producto_liviano):
        carro = Carro(10.0)
        pedido1 = Pedido("PED-001", "Cliente", {producto_liviano: 2})
        pedido2 = Pedido("PED-002", "Cliente", {producto_liviano: 2})

        carro.agregar_pedido(pedido1)
        carro.agregar_pedido(pedido2)

        assert carro.total_batches() == 1


class TestCarroPeso:
    def test_peso_batch_actual_vacio_es_cero(self):
        carro = Carro(20.0)
        assert carro.peso_batch_actual() == 0.0

    def test_peso_batch_actual_calcula_correctamente(self, producto_liviano):
        carro = Carro(20.0)
        pedido = Pedido("PED-001", "Cliente", {producto_liviano: 3})

        carro.agregar_pedido(pedido)

        assert carro.peso_batch_actual() == 6.0

    def test_peso_con_cantidad_mayor_uno(self, producto_pesado):
        carro = Carro(50.0)
        pedido = Pedido("PED-001", "Cliente", {producto_pesado: 3})

        carro.agregar_pedido(pedido)

        assert carro.peso_batch_actual() == 15.0


class TestCarroBatchActual:
    def test_batch_actual_retorna_set_vacio_inicial(self):
        carro = Carro(20.0)
        assert carro.batch_actual() == set()

    def test_batch_actual_retorna_pedidos_agregados(self, producto_liviano):
        carro = Carro(20.0)
        pedido = Pedido("PED-001", "Cliente", {producto_liviano: 1})

        carro.agregar_pedido(pedido)

        assert pedido in carro.batch_actual()

    def test_batches_retorna_lista_de_copias(self, producto_liviano):
        carro = Carro(20.0)
        pedido = Pedido("PED-001", "Cliente", {producto_liviano: 1})

        carro.agregar_pedido(pedido)
        batches = carro.batches

        assert len(batches) == 1
        batches[0].add("esto no afecta el original")


class TestCarroValidaciones:
    def test_agregar_no_pedido_lanza_error(self):
        carro = Carro(20.0)

        with pytest.raises(ValueError, match="Se esperaba un Pedido"):
            carro.agregar_pedido("no es pedido")

    def test_puede_agregar_no_pedido_lanza_error(self):
        carro = Carro(20.0)

        with pytest.raises(ValueError, match="Se esperaba un Pedido"):
            carro.puede_agregar("no es pedido")
