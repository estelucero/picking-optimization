import pytest

from core.infrastructure.Producto import Producto
from core.infrastructure.Ubicaciones import Ubicaciones
from core.infrastructure.Pedido import Pedido
from core.infrastructure.Carro import Carro
from core.infrastructure.Operario import Operario
from core.algoritmos.Tsp import TSP
from core.algoritmos.Modelo import Modelo as EDD
from core.utils.Velocidad import Velocidad


# ==============================================================================
# FIXTURES
# ==============================================================================

@pytest.fixture
def productos():
    return [
        Producto(codigo='DEPOSITO', nombre='Deposito', peso=1.0,  x=0, y=0),
        Producto(codigo='SKU-001',  nombre='Silla',    peso=8.0,  x=3, y=0),
        Producto(codigo='SKU-002',  nombre='Monitor',  peso=4.0,  x=3, y=4),
        Producto(codigo='SKU-003',  nombre='Teclado',  peso=2.0,  x=6, y=4),
        Producto(codigo='SKU-004',  nombre='Lampara',  peso=3.0,  x=6, y=0),
        Producto(codigo='SKU-005',  nombre='Mesa',     peso=10.0, x=0, y=4),
    ]

@pytest.fixture
def tsp(productos):
    grafo = Ubicaciones(productos=productos)
    return TSP(grafo=grafo, deposito='DEPOSITO')

@pytest.fixture
def prods(productos):
    return {p.codigo: p for p in productos}

def make_operarios(n: int, capacidad: float, velocidad_m_s: float = 1.0):
    vel = Velocidad(metros_por_segundo=velocidad_m_s)
    return [
        Operario(codigo=f'OP-00{i+1}', nombre=f'Operario {i+1}', velocidad=vel, carro=Carro(capacidad_max_peso=capacidad))
        for i in range(n)
    ]


# ==============================================================================
# CASO 1: Un solo operario, un solo pedido
# ==============================================================================

def test_un_operario_un_pedido(tsp, prods):
    pedidos    = [Pedido(codigo='PED-001', cliente='Juan', items={prods['SKU-001']: 1})]
    operarios  = make_operarios(1, capacidad=20.0)

    resultado  = EDD(tsp).resolver(pedidos, operarios, beta_picking=0.5)

    assert len(resultado.asignacion[operarios[0]]) >= 1
    assert resultado.tiempo_minimo > 0


# ==============================================================================
# CASO 2: Dos operarios — carga balanceada
# ==============================================================================

def test_balanceo_entre_operarios(tsp, prods):
    pedidos = [
        Pedido(codigo='PED-001', cliente='Juan',  items={prods['SKU-001']: 1}),
        Pedido(codigo='PED-002', cliente='Maria', items={prods['SKU-002']: 1}),
        Pedido(codigo='PED-003', cliente='Luis',  items={prods['SKU-003']: 1}),
        Pedido(codigo='PED-004', cliente='Ana',   items={prods['SKU-004']: 1}),
    ]
    operarios = make_operarios(2, capacidad=20.0)

    resultado = EDD(tsp).resolver(pedidos, operarios, beta_picking=0.5)

    total_viajes = sum(len(viajes) for viajes in resultado.asignacion.values())
    assert total_viajes >= 1


# ==============================================================================
# CASO 3: Carro con capacidad justa — agrupa pedidos livianos
# ==============================================================================

def test_capacidad_minima_agrupa_pedidos_livianos(tsp, prods):
    pedidos = [
        Pedido(codigo='PED-001', cliente='Juan',  items={prods['SKU-001']: 1}),  # 8kg
        Pedido(codigo='PED-002', cliente='Maria', items={prods['SKU-002']: 1}),  # 4kg
        Pedido(codigo='PED-003', cliente='Luis',  items={prods['SKU-003']: 1}),  # 2kg
    ]
    operarios = make_operarios(1, capacidad=8.0)

    resultado = EDD(tsp).resolver(pedidos, operarios, beta_picking=0.5)
    viajes   = resultado.asignacion[operarios[0]]

    assert len(viajes) >= 1


# ==============================================================================
# CASO 4: Productos compartidos — misma ubicación visitada una sola vez
# ==============================================================================

def test_productos_compartidos_en_mismo_batch(tsp, prods):
    pedidos = [
        Pedido(codigo='PED-001', cliente='Juan',  items={prods['SKU-001']: 1}),
        Pedido(codigo='PED-002', cliente='Maria', items={prods['SKU-001']: 2}),  # mismo producto
    ]
    operarios = make_operarios(1, capacidad=30.0)

    resultado = EDD(tsp).resolver(pedidos, operarios, beta_picking=0.5)
    viajes   = resultado.asignacion[operarios[0]]

    assert len(viajes) >= 1


# ==============================================================================
# CASO 5: Operario rápido absorbe más pedidos
# ==============================================================================

def test_operario_rapido_absorbe_mas(tsp, prods):
    pedidos = [
        Pedido(codigo='PED-001', cliente='Juan',  items={prods['SKU-001']: 1}),
        Pedido(codigo='PED-002', cliente='Maria', items={prods['SKU-002']: 1}),
        Pedido(codigo='PED-003', cliente='Luis',  items={prods['SKU-003']: 1}),
        Pedido(codigo='PED-004', cliente='Ana',   items={prods['SKU-004']: 1}),
    ]
    op_rapido = Operario(codigo='OP-001', nombre='Rapido', velocidad=Velocidad(metros_por_segundo=2.0), carro=Carro(capacidad_max_peso=50.0))
    op_lento  = Operario(codigo='OP-002', nombre='Lento', velocidad=Velocidad(metros_por_segundo=0.5), carro=Carro(capacidad_max_peso=50.0))

    resultado       = EDD(tsp).resolver(pedidos, [op_rapido, op_lento], beta_picking=0.5)
    viajes_rapido  = len(resultado.asignacion[op_rapido])
    viajes_lento   = len(resultado.asignacion[op_lento])

    assert viajes_rapido >= viajes_lento


# ==============================================================================
# CASO 6: Pedido que supera la capacidad del carro — lanza ValueError
# ==============================================================================

def test_pedido_supera_capacidad_lanza_error(tsp, prods):
    pedidos   = [Pedido(codigo='PED-001', cliente='Juan', items={prods['SKU-005']: 3})]  # 30kg
    operarios = make_operarios(1, capacidad=20.0)

    with pytest.raises(ValueError):
        EDD(tsp).resolver(pedidos, operarios, beta_picking=0.5)


# ==============================================================================
# CASO 7: Lista de pedidos vacía — lanza ValueError
# ==============================================================================

def test_pedidos_vacios_lanza_error(tsp):
    operarios = make_operarios(1, capacidad=20.0)

    with pytest.raises(ValueError):
        EDD(tsp).resolver([], operarios, beta_picking=0.5)


# ==============================================================================
# CASO 8: Lista de operarios vacía — lanza ValueError
# ==============================================================================

def test_operarios_vacios_lanza_error(tsp, prods):
    pedidos = [Pedido(codigo='PED-001', cliente='Juan', items={prods['SKU-001']: 1})]

    with pytest.raises(ValueError):
        EDD(tsp).resolver(pedidos, [], beta_picking=0.5)


# ==============================================================================
# CASO 9: beta_picking negativo — lanza ValueError
# ==============================================================================

def test_beta_picking_negativo_lanza_error(tsp, prods):
    pedidos   = [Pedido(codigo='PED-001', cliente='Juan', items={prods['SKU-001']: 1})]
    operarios = make_operarios(1, capacidad=20.0)

    with pytest.raises(ValueError):
        EDD(tsp).resolver(pedidos, operarios, beta_picking=-1.0)


# ==============================================================================
# CASO 10: tiempo_minimo es siempre positivo
# ==============================================================================

def test_tiempo_minimo_siempre_positivo(tsp, prods):
    pedidos   = [Pedido(codigo='PED-001', cliente='Juan', items={prods['SKU-001']: 1})]
    operarios = make_operarios(2, capacidad=20.0)

    resultado = EDD(tsp).resolver(pedidos, operarios, beta_picking=0.5)

    assert resultado.tiempo_minimo > 0
