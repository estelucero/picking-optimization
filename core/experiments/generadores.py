import random
from core.infrastructure.Producto import Producto
from core.infrastructure.Pedido import Pedido
from core.infrastructure.Carro import Carro
from core.infrastructure.Operario import Operario
from core.utils.Velocidad import Velocidad


def crear_producto(codigo: str, nombre: str, peso: float, x: int, y: int) -> Producto:
    return Producto(codigo=codigo, nombre=nombre, peso=peso, x=x, y=y)


def crear_productos_grid(cantidad: int, nombre: str = "Producto") -> list[Producto]:
    productos = [Producto(codigo="DEPOSITO", nombre="Deposito",peso= 1.0, x=0, y=0)]
    for i in range(cantidad):
        x = (i % 10) + 1
        y = (i // 10) + 1
        productos.append(Producto(codigo=f"SKU-{i+1:03d}",nombre=f"{nombre} {i+1}", peso=random.uniform(0.5, 10.0), x=x, y=y))
    return productos


def crear_pedidos_desde_productos(
    productos: list[Producto],
    cantidad_pedidos: int,
    items_por_pedido: tuple[int, int] = (1, 3),
) -> list[Pedido]:
    pedidos = []
    productos_seleccion = [p for p in productos if p.codigo != "DEPOSITO"]
    for i in range(cantidad_pedidos):
        items_count = random.randint(items_por_pedido[0], items_por_pedido[1])
        items = random.sample(productos_seleccion, min(items_count, len(productos_seleccion)))
        pedido_items = {p: 1 for p in items}
        pedidos.append(Pedido(codigo=f"PED-{i+1:03d}", cliente=f"Cliente {i+1}", items=pedido_items))
    return pedidos


def crear_operarios(cantidad: int, velocidad_metros_por_segundo: float = 1.0, capacidad_carro: float = 30.0) -> list[Operario]:
    operarios = []
    for i in range(cantidad):
        velocidad = Velocidad(m_por_segundo=velocidad_metros_por_segundo)
        operarios.append(Operario(codigo=f"OP-{i+1:03d}", nombre=f"Operario {i+1}", velocidad=velocidad, carro=Carro(capacidad_max_peso=capacidad_carro)))
    return operarios


def crear_operarios_velocidades_distintas(cantidad: int, capacidad_carro: float = 30.0) -> list[Operario]:
    velocidades = [0.8, 1.0, 1.2, 1.5]
    operarios = []
    for i in range(cantidad):
        velocidad = Velocidad(m_por_segundo=velocidades[i % len(velocidades)])
        operarios.append(Operario(codigo=f"OP-{i+1:03d}", nombre=f"Operario {i+1}", velocidad=velocidad, carro=Carro(capacidad_max_peso=capacidad_carro)))
    return operarios
