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
        Producto('DEPOSITO', 'Deposito', 1.0,  0, 0),
        Producto('SKU-001',  'Silla',    8.0,  3, 0),
        Producto('SKU-002',  'Monitor',  4.0,  3, 4),
        Producto('SKU-003',  'Teclado',  2.0,  6, 4),
        Producto('SKU-004',  'Lampara',  3.0,  6, 0),
        Producto('SKU-005',  'Mesa',     10.0, 0, 4),
    ]

@pytest.fixture
def tsp(productos):
    grafo = Ubicaciones(productos)
    return TSP(grafo, deposito='DEPOSITO')

@pytest.fixture
def prods(productos):
    return {p.codigo: p for p in productos}

def make_operarios(n: int, capacidad: float, velocidad_m_s: float = 1.0):
    vel = Velocidad(velocidad_m_s)
    return [
        Operario(f'OP-00{i+1}', f'Operario {i+1}', vel, Carro(capacidad))
        for i in range(n)
    ]


# ==============================================================================
# CASO 1: Un solo operario, un solo pedido
# ==============================================================================

def test_un_operario_un_pedido(tsp, prods):
    pedidos    = [Pedido('PED-001', 'Juan', {prods['SKU-001']: 1})]
    operarios  = make_operarios(1, capacidad=20.0)

    resultado  = EDD(tsp).resolver(pedidos, operarios, beta_picking=0.5)

    assert len(resultado.asignacion[operarios[0]]) == 1
    assert resultado.tiempo_minimo > 0


# ==============================================================================
# CASO 2: Dos operarios — carga balanceada
# ==============================================================================

def test_balanceo_entre_operarios(tsp, prods):
    pedidos = [
        Pedido('PED-001', 'Juan',  {prods['SKU-001']: 1}),
        Pedido('PED-002', 'Maria', {prods['SKU-002']: 1}),
        Pedido('PED-003', 'Luis',  {prods['SKU-003']: 1}),
        Pedido('PED-004', 'Ana',   {prods['SKU-004']: 1}),
    ]
    operarios = make_operarios(2, capacidad=20.0)

    resultado = EDD(tsp).resolver(pedidos, operarios, beta_picking=0.5)

    total_batches = sum(len(b) for b in resultado.asignacion.values())
    assert total_batches >= 2


# ==============================================================================
# CASO 3: Carro con capacidad justa — agrupa pedidos livianos
# ==============================================================================

def test_capacidad_minima_agrupa_pedidos_livianos(tsp, prods):
    pedidos = [
        Pedido('PED-001', 'Juan',  {prods['SKU-001']: 1}),  # 8kg
        Pedido('PED-002', 'Maria', {prods['SKU-002']: 1}),  # 4kg
        Pedido('PED-003', 'Luis',  {prods['SKU-003']: 1}),  # 2kg
    ]
    operarios = make_operarios(1, capacidad=8.0)

    resultado = EDD(tsp).resolver(pedidos, operarios, beta_picking=0.5)
    batches   = resultado.asignacion[operarios[0]]

    # PED-001 no entra con nadie (8kg exacto), PED-002+PED-003 entran juntos (6kg)
    assert len(batches) == 2


# ==============================================================================
# CASO 4: Productos compartidos — misma ubicación visitada una sola vez
# ==============================================================================

def test_productos_compartidos_en_mismo_batch(tsp, prods):
    pedidos = [
        Pedido('PED-001', 'Juan',  {prods['SKU-001']: 1}),
        Pedido('PED-002', 'Maria', {prods['SKU-001']: 2}),  # mismo producto
    ]
    operarios = make_operarios(1, capacidad=30.0)

    resultado = EDD(tsp).resolver(pedidos, operarios, beta_picking=0.5)
    batches   = resultado.asignacion[operarios[0]]

    assert len(batches) == 1


# ==============================================================================
# CASO 5: Operario rápido absorbe más pedidos
# ==============================================================================

def test_operario_rapido_absorbe_mas(tsp, prods):
    pedidos = [
        Pedido('PED-001', 'Juan',  {prods['SKU-001']: 1}),
        Pedido('PED-002', 'Maria', {prods['SKU-002']: 1}),
        Pedido('PED-003', 'Luis',  {prods['SKU-003']: 1}),
        Pedido('PED-004', 'Ana',   {prods['SKU-004']: 1}),
    ]
    op_rapido = Operario('OP-001', 'Rapido', Velocidad(2.0), Carro(50.0))
    op_lento  = Operario('OP-002', 'Lento', Velocidad(0.5), Carro(50.0))

    resultado       = EDD(tsp).resolver(pedidos, [op_rapido, op_lento], beta_picking=0.5)
    pedidos_rapido  = sum(len(b) for b in resultado.asignacion[op_rapido])
    pedidos_lento   = sum(len(b) for b in resultado.asignacion[op_lento])

    assert pedidos_rapido >= pedidos_lento


# ==============================================================================
# CASO 6: Pedido que supera la capacidad del carro — lanza ValueError
# ==============================================================================

def test_pedido_supera_capacidad_lanza_error(tsp, prods):
    pedidos   = [Pedido('PED-001', 'Juan', {prods['SKU-005']: 3})]  # 30kg
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
    pedidos = [Pedido('PED-001', 'Juan', {prods['SKU-001']: 1})]

    with pytest.raises(ValueError):
        EDD(tsp).resolver(pedidos, [], beta_picking=0.5)


# ==============================================================================
# CASO 9: beta_picking negativo — lanza ValueError
# ==============================================================================

def test_beta_picking_negativo_lanza_error(tsp, prods):
    pedidos   = [Pedido('PED-001', 'Juan', {prods['SKU-001']: 1})]
    operarios = make_operarios(1, capacidad=20.0)

    with pytest.raises(ValueError):
        EDD(tsp).resolver(pedidos, operarios, beta_picking=-1.0)


# ==============================================================================
# CASO 10: tiempo_minimo es siempre positivo
# ==============================================================================

def test_tiempo_minimo_siempre_positivo(tsp, prods):
    pedidos   = [Pedido('PED-001', 'Juan', {prods['SKU-001']: 1})]
    operarios = make_operarios(2, capacidad=20.0)

    resultado = EDD(tsp).resolver(pedidos, operarios, beta_picking=0.5)

    assert resultado.tiempo_minimo > 0