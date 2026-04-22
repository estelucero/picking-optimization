import pytest

from core.infrastructure.Producto import Producto
from core.infrastructure.Carro import Carro


@pytest.fixture
def producto_liviano():
    return Producto("SKU-001", "Producto Liviano", 2.0, 0, 0)


@pytest.fixture
def producto_pesado():
    return Producto("SKU-002", "Producto Pesado", 5.0, 0, 0)


class TestCarroConstruccion:
    def test_capacidad_default_es_20(self):
        carro = Carro()
        assert carro.capacidad_max_peso == 20.0

    def test_capacidad_custom_es_50(self):
        carro = Carro(50.0)
        assert carro.capacidad_max_peso == 50.0

    def test_capacidad_cero_lanza_error(self):
        with pytest.raises(ValueError, match="mayor a 0"):
            Carro(0)

    def test_capacidad_negativa_lanza_error(self):
        with pytest.raises(ValueError, match="mayor a 0"):
            Carro(-10)

    def test_capacidad_string_lanza_error(self):
        with pytest.raises(ValueError):
            Carro("diez")

    def test_carro_inicia_vacio(self):
        carro = Carro()
        assert carro.batch == {}
        assert carro.capacidad_usada == 0
        assert carro.peso_batch_actual() == 0.0


class TestCarroAgregarProducto:
    def test_puede_agregar_producto_dentro_capacidad(self, producto_liviano):
        carro = Carro(20.0)
        assert carro.puede_agregar(producto_liviano, 1) is True

    def test_no_puede_agregar_producto_que_supera_capacidad(self, producto_pesado):
        carro = Carro(3.0)
        assert carro.puede_agregar(producto_pesado, 1) is False

    def test_agregar_producto_crea_batch(self, producto_liviano):
        carro = Carro(20.0)
        carro.agregar_producto(producto_liviano, 1)
        assert producto_liviano in carro.batch

    def test_agregar_producto_supera_capacidad_lanza_error(self, producto_pesado):
        carro = Carro(3.0)
        with pytest.raises(ValueError, match="supera por s"):
            carro.agregar_producto(producto_pesado, 1)

    def test_agregar_producto_multiple_cantidad(self, producto_liviano):
        carro = Carro(20.0)
        carro.agregar_producto(producto_liviano, 3)
        assert carro.batch[producto_liviano] == 3
        assert carro.peso_batch_actual() == 6.0

    def test_agregar_producto_duplicado_suma_cantidad(self, producto_liviano):
        carro = Carro(20.0)
        carro.agregar_producto(producto_liviano, 2)
        carro.agregar_producto(producto_liviano, 3)
        assert carro.batch[producto_liviano] == 5


class TestCarroPeso:
    def test_peso_batch_actual_vacio_es_cero(self):
        carro = Carro(20.0)
        assert carro.peso_batch_actual() == 0.0

    def test_peso_batch_actual_calcula_correctamente(self, producto_liviano):
        carro = Carro(20.0)
        carro.agregar_producto(producto_liviano, 3)
        assert carro.peso_batch_actual() == 6.0

    def test_peso_con_cantidad_mayor_uno(self, producto_pesado):
        carro = Carro(50.0)
        carro.agregar_producto(producto_pesado, 3)
        assert carro.peso_batch_actual() == 15.0

    def test_capacidad_restante_calcula_correctamente(self, producto_liviano):
        carro = Carro(20.0)
        carro.agregar_producto(producto_liviano, 5)
        assert carro.capacidad_restante() == 10.0

    def test_capacidad_restante_cero_cuando_lleno(self, producto_liviano):
        carro = Carro(10.0)
        carro.agregar_producto(producto_liviano, 5)
        assert carro.capacidad_restante() == 0.0


class TestCarroVaciar:
    def test_vaciar_limpia_batch(self, producto_liviano):
        carro = Carro(20.0)
        carro.agregar_producto(producto_liviano, 2)
        carro.vaciar()
        assert carro.batch == {}

    def test_vaciar_limpia_capacidad_usada(self, producto_liviano):
        carro = Carro(20.0)
        carro.agregar_producto(producto_liviano, 2)
        carro.vaciar()
        assert carro.capacidad_usada == 0

    def test_vaciar_retorna_productos_removidos(self, producto_liviano, producto_pesado):
        carro = Carro(50.0)
        carro.agregar_producto(producto_liviano, 2)
        carro.agregar_producto(producto_pesado, 1)
        resultado = carro.vaciar()
        assert resultado[producto_liviano] == 2
        assert resultado[producto_pesado] == 1

    def test_vaciar_vacio_no_falla(self):
        carro = Carro(20.0)
        resultado = carro.vaciar()
        assert resultado == {}


class TestCarroValidaciones:
    def test_agregar_no_producto_lanza_error(self):
        carro = Carro(20.0)
        with pytest.raises(ValueError, match="Se esperaba un Producto"):
            carro.agregar_producto("no es producto", 1)

    def test_puede_agregar_no_producto_lanza_error(self):
        carro = Carro(20.0)
        with pytest.raises(ValueError, match="Se esperaba un Producto"):
            carro.puede_agregar("no es producto", 1)


class TestCarroCompatibilidad:
    def test_batch_actual_retorna_copia(self, producto_liviano):
        carro = Carro(20.0)
        carro.agregar_producto(producto_liviano, 1)
        batch = carro.batch_actual()
        batch[producto_liviano] = 999
        assert carro.batch[producto_liviano] == 1

    def test_total_batches_retorna_cantidad(self, producto_liviano, producto_pesado):
        carro = Carro(50.0)
        carro.agregar_producto(producto_liviano, 1)
        carro.agregar_producto(producto_pesado, 1)
        assert carro.total_batches() == 2
