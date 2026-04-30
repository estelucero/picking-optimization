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
        Producto(codigo="DEPOSITO", nombre="Deposito", peso=1.0, x=0, y=0),
        Producto(codigo="SKU-001", nombre="Producto A", peso=2.0, x=1, y=1),
        Producto(codigo="SKU-002", nombre="Producto B", peso=3.0, x=2, y=2),
        Producto(codigo="SKU-003", nombre="Producto C", peso=1.0, x=3, y=3),
    ]


@pytest.fixture
def pedidos_simple(productos_simple):
    return [
        Pedido(codigo="PED-001", cliente="Cliente A", items={productos_simple[1]: 1}),
        Pedido(codigo="PED-002", cliente="Cliente B", items={productos_simple[2]: 1}),
    ]


@pytest.fixture
def operarios_simple():
    velocidad = Velocidad(metros_por_segundo=1.0)
    return [
        Operario(codigo="OP-001", nombre="Operario 1", velocidad=velocidad, carro=Carro(capacidad_max_peso=20.0)),
        Operario(codigo="OP-002", nombre="Operario 2", velocidad=velocidad, carro=Carro(capacidad_max_peso=20.0)),
    ]


@pytest.fixture
def grafo_simple(productos_simple):
    return Ubicaciones(productos=productos_simple)


@pytest.fixture
def tsp_simple(grafo_simple):
    return TSP(grafo=grafo_simple, deposito="DEPOSITO")


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
        total_productos = sum(len(viaje.secuencia) for viajes in resultado.asignacion.values() for viaje in viajes)
        assert total_productos == 2

    def test_resolver_retorna_secuencia(self, tsp_simple, pedidos_simple, operarios_simple):
        modelo = Modelo(tsp_simple)
        resultado = modelo.resolver(pedidos_simple, operarios_simple, beta_picking=0.5)
        assert resultado.secuencia is not None


class TestModeloDesempaquetar:
    def test_desempaquetar_un_pedido(self, tsp_simple, productos_simple):
        modelo = Modelo(tsp_simple)
        pedidos = [Pedido(codigo="PED-001", cliente="Cliente", items={productos_simple[1]: 2})]
        productos = modelo._desempaquetar_pedidos(pedidos)
        assert len(productos) == 1
        assert productos[0][0].codigo == "SKU-001"
        assert productos[0][1] == 2

    def test_desempaquetar_multiples_pedidos(self, tsp_simple, productos_simple):
        modelo = Modelo(tsp_simple)
        pedidos = [
            Pedido(codigo="PED-001", cliente="Cliente A", items={productos_simple[1]: 1}),
            Pedido(codigo="PED-002", cliente="Cliente B", items={productos_simple[2]: 2}),
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
        velocidad = Velocidad(metros_por_segundo=1.0)
        operarios = [Operario(codigo="OP-001", nombre="Operario 1", velocidad=velocidad, carro=Carro(capacidad_max_peso=50.0))]
        pedidos = [
            Pedido(codigo="PED-001", cliente="Cliente", items={productos_simple[1]: 1}),
        ]
        modelo = Modelo(tsp_simple)
        resultado = modelo.resolver(pedidos, operarios, beta_picking=0.5)
        assert len(operarios[0].viajes) >= 1

    def test_cada_viaje_tiene_productos(self, tsp_simple, productos_simple):
        velocidad = Velocidad(metros_por_segundo=1.0)
        operarios = [Operario(codigo="OP-001", nombre="Operario 1", velocidad=velocidad, carro=Carro(capacidad_max_peso=50.0))]
        pedidos = [
            Pedido(codigo="PED-001", cliente="Cliente", items={productos_simple[1]: 1}),
        ]
        modelo = Modelo(tsp_simple)
        resultado = modelo.resolver(pedidos, operarios, beta_picking=0.5)
        for viaje in operarios[0].viajes:
            assert len(viaje.secuencia) > 0

    def test_producto_supera_capacidad_se_asigna_sin_error(self, tsp_simple):
        """Verifica que productos pesados se distribuyan sin tirar error."""
        productos = [
            Producto(codigo="DEPOSITO", nombre="Deposito", peso=1.0, x=0, y=0),
            Producto(codigo="SKU-001", nombre="Producto A", peso=25.0, x=1, y=1),
            Producto(codigo="SKU-002", nombre="Producto B", peso=25.0, x=2, y=2),
        ]

        velocidad = Velocidad(metros_por_segundo=1.0)
        operarios = [
            Operario(codigo="OP-001", nombre="Operario 1", velocidad=velocidad, carro=Carro(capacidad_max_peso=30.0)),
            Operario(codigo="OP-002", nombre="Operario 2", velocidad=velocidad, carro=Carro(capacidad_max_peso=30.0)),
        ]

        pedido = Pedido(codigo="PED-001", cliente="Cliente", items={productos[1]: 1, productos[2]: 1})

        modelo = Modelo(tsp_simple)
        resultado = modelo.resolver([pedido], operarios, beta_picking=0.5)

        total_items_asignados = sum(
            sum(cantidad for _, cantidad in viaje.secuencia)
            for viaje in operarios[0].viajes + operarios[1].viajes
        )
        assert total_items_asignados == 2

    def test_pedido_con_productos_pesados_se_distribuye(self, tsp_simple):
        """Un pedido muy pesado se distribuye en múltiples viajes."""
        productos = [
            Producto(codigo="DEPOSITO", nombre="Deposito", peso=1.0, x=0, y=0),
            Producto(codigo="SKU-001", nombre="Producto Pesado 1", peso=25.0, x=1, y=1),
            Producto(codigo="SKU-002", nombre="Producto Pesado 2", peso=25.0, x=2, y=2),
            Producto(codigo="SKU-003", nombre="Producto Pesado 3", peso=25.0, x=3, y=3),
        ]

        velocidad = Velocidad(metros_por_segundo=1.0)
        capacidad_carro = 30.0

        operarios = [
            Operario(codigo="OP-001", nombre="Operario 1", velocidad=velocidad, carro=Carro(capacidad_max_peso=capacidad_carro)),
            Operario(codigo="OP-002", nombre="Operario 2", velocidad=velocidad, carro=Carro(capacidad_max_peso=capacidad_carro)),
        ]

        pedido = Pedido(codigo="PED-001", cliente="Cliente", items={
            productos[1]: 1,
            productos[2]: 1,
            productos[3]: 1,
        })

        modelo = Modelo(tsp_simple)
        resultado = modelo.resolver([pedido], operarios, beta_picking=0.5)

        total_items = sum(
            sum(cantidad for _, cantidad in viaje.secuencia)
            for viaje in operarios[0].viajes + operarios[1].viajes
        )
        assert total_items == 3
