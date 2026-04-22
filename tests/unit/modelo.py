import pytest

from core.algoritmos.Modelo import Modelo
from core.algoritmos.Tsp import TSP
from core.infrastructure.Carro import Carro
from core.infrastructure.Operario import Operario
from core.infrastructure.Pedido import Pedido
from core.infrastructure.Producto import Producto
from core.infrastructure.Ubicaciones import Ubicaciones
from core.utils.Velocidad import Velocidad


@pytest.fixture
def productos_simple():
    return [
        Producto("DEPOSITO", "Deposito", 1.0, 0, 0),
        Producto("SKU-001", "Producto A", 2.0, 1, 1),
        Producto("SKU-002", "Producto B", 3.0, 2, 2),
        Producto("SKU-003", "Producto C", 1.0, 3, 3),
    ]


@pytest.fixture
def pedidos_simple(productos_simple):
    return [
        Pedido("PED-001", "Cliente A", {productos_simple[1]: 1}),
        Pedido("PED-002", "Cliente B", {productos_simple[2]: 1}),
    ]


@pytest.fixture
def operarios_simple():
    velocidad = Velocidad(1.0)
    return [
        Operario("OP-001", "Operario 1", velocidad, Carro(20.0)),
        Operario("OP-002", "Operario 2", velocidad, Carro(20.0)),
    ]


@pytest.fixture
def grafo_simple(productos_simple):
    return Ubicaciones(productos_simple)


@pytest.fixture
def tsp_simple(grafo_simple):
    return TSP(grafo_simple, deposito="DEPOSITO")


class TestModeloConstruccion:
    def test_constructor_con_tsp(self, tsp_simple):
        modelo = Modelo(tsp_simple)
        assert modelo is not None

    def test_constructor_no_tsp_lanza_error(self):
        with pytest.raises(ValueError, match="Se esperaba un TSP"):
            Modelo("no es tsp")


class TestModeloResolver:
    def test_resolver_retorna_resultado(self, tsp_simple, pedidos_simple, operarios_simple):
        modelo = Modelo(tsp_simple)
        resultado = modelo.resolver(pedidos_simple, operarios_simple, beta_picking=0.5)
        assert resultado is not None

    def test_resolver_asigna_todos_los_pedidos(self, tsp_simple, pedidos_simple, operarios_simple):
        modelo = Modelo(tsp_simple)
        resultado = modelo.resolver(pedidos_simple, operarios_simple, beta_picking=0.5)
        total_productos = sum(len(viaje.productos) for viaje in resultado.asignacion.values() for viaje in viaje)
        assert total_productos == 2

    def test_resolver_retorna_secuencia(self, tsp_simple, pedidos_simple, operarios_simple):
        modelo = Modelo(tsp_simple)
        resultado = modelo.resolver(pedidos_simple, operarios_simple, beta_picking=0.5)
        assert len(resultado.secuencia) == 2


class TestModeloDesempaquetar:
    def test_desempaquetar_un_pedido(self, tsp_simple, productos_simple):
        modelo = Modelo(tsp_simple)
        pedidos = [Pedido("PED-001", "Cliente", {productos_simple[1]: 2})]
        productos = modelo._desempaquetar_pedidos(pedidos)
        assert len(productos) == 1
        assert productos[0][0].codigo == "SKU-001"
        assert productos[0][1] == 2

    def test_desempaquetar_multiples_pedidos(self, tsp_simple, productos_simple):
        modelo = Modelo(tsp_simple)
        pedidos = [
            Pedido("PED-001", "Cliente A", {productos_simple[1]: 1}),
            Pedido("PED-002", "Cliente B", {productos_simple[2]: 2}),
        ]
        productos = modelo._desempaquetar_pedidos(pedidos)
        assert len(productos) == 2


class TestModeloValidaciones:
    def test_pedidos_vacio_lanza_error(self, tsp_simple, operarios_simple):
        modelo = Modelo(tsp_simple)
        with pytest.raises(ValueError, match="lista no vacía"):
            modelo.resolver([], operarios_simple, 0.5)

    def test_operarios_vacio_lanza_error(self, tsp_simple, pedidos_simple):
        modelo = Modelo(tsp_simple)
        with pytest.raises(ValueError, match="lista no vacía"):
            modelo.resolver(pedidos_simple, [], 0.5)

    def test_beta_negativo_lanza_error(self, tsp_simple, pedidos_simple, operarios_simple):
        modelo = Modelo(tsp_simple)
        with pytest.raises(ValueError, match="número no negativo"):
            modelo.resolver(pedidos_simple, operarios_simple, -1)


class TestModeloViajes:
    def test_viajes_se_crean(self, tsp_simple, productos_simple):
        velocidad = Velocidad(1.0)
        operarios = [Operario("OP-001", "Operario 1", velocidad, Carro(50.0))]
        pedidos = [
            Pedido("PED-001", "Cliente", {productos_simple[1]: 1}),
        ]
        modelo = Modelo(tsp_simple)
        resultado = modelo.resolver(pedidos, operarios, beta_picking=0.5)
        assert len(operarios[0].viajes) >= 1

    def test_cada_viaje_tiene_productos(self, tsp_simple, productos_simple):
        velocidad = Velocidad(1.0)
        operarios = [Operario("OP-001", "Operario 1", velocidad, Carro(50.0))]
        pedidos = [
            Pedido("PED-001", "Cliente", {productos_simple[1]: 1}),
        ]
        modelo = Modelo(tsp_simple)
        resultado = modelo.resolver(pedidos, operarios, beta_picking=0.5)
        for viaje in operarios[0].viajes:
            assert len(viaje.productos) > 0

    def test_producto_supera_capacidad_se_asigna_sin_error(self, tsp_simple):
        """Verifica que productos pesados se distribuyan sin tirar error."""
        productos = [
            Producto("DEPOSITO", "Deposito", 1.0, 0, 0),
            Producto("SKU-001", "Producto A", 25.0, 1, 1),
            Producto("SKU-002", "Producto B", 25.0, 2, 2),
        ]

        velocidad = Velocidad(1.0)
        operarios = [
            Operario("OP-001", "Operario 1", velocidad, Carro(30.0)),
            Operario("OP-002", "Operario 2", velocidad, Carro(30.0)),
        ]

        pedido = Pedido("PED-001", "Cliente", {productos[1]: 1, productos[2]: 1})

        modelo = Modelo(tsp_simple)
        resultado = modelo.resolver([pedido], operarios, beta_picking=0.5)

        total_items_asignados = sum(
            sum(cantidad for cantidad in viaje.productos.values())
            for viaje in operarios[0].viajes + operarios[1].viajes
        )
        assert total_items_asignados == 2

    def test_pedido_con_productos_pesados_se_distribuye(self, tsp_simple):
        """Un pedido muy pesado se distribuye en múltiples viajes."""
        productos = [
            Producto("DEPOSITO", "Deposito", 1.0, 0, 0),
            Producto("SKU-001", "Producto Pesado 1", 25.0, 1, 1),
            Producto("SKU-002", "Producto Pesado 2", 25.0, 2, 2),
            Producto("SKU-003", "Producto Pesado 3", 25.0, 3, 3),
        ]

        velocidad = Velocidad(1.0)
        capacidad_carro = 30.0

        operarios = [
            Operario("OP-001", "Operario 1", velocidad, Carro(capacidad_carro)),
            Operario("OP-002", "Operario 2", velocidad, Carro(capacidad_carro)),
        ]

        pedido = Pedido("PED-001", "Cliente", {
            productos[1]: 1,
            productos[2]: 1,
            productos[3]: 1,
        })

        modelo = Modelo(tsp_simple)
        resultado = modelo.resolver([pedido], operarios, beta_picking=0.5)

        total_items = sum(
            sum(cantidad for cantidad in viaje.productos.values())
            for viaje in operarios[0].viajes + operarios[1].viajes
        )
        assert total_items == 3