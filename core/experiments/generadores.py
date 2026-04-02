import random
from core.infrastructure.Producto import Producto
from core.infrastructure.Pedido import Pedido
from core.infrastructure.Carro import Carro
from core.infrastructure.Operario import Operario
from core.utils.Velocidad import Velocidad


def crear_producto(codigo: str, nombre: str, peso: float, x: int, y: int) -> Producto:
    return Producto(codigo, nombre, peso, x, y)


def crear_productos_grid(cantidad: int, nombre: str = "Producto") -> list[Producto]:
    productos = [Producto("DEPOSITO", "Deposito", 1.0, 0, 0)]
    for i in range(cantidad):
        x = (i % 10) + 1
        y = (i // 10) + 1
        productos.append(Producto(f"SKU-{i+1:03d}", f"{nombre} {i+1}", random.uniform(0.5, 10.0), x, y))
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
        pedidos.append(Pedido(f"PED-{i+1:03d}", f"Cliente {i+1}", pedido_items))
    return pedidos


def crear_operarios(cantidad: int, velocidad_metros_por_segundo: float = 1.0, capacidad_carro: float = 30.0) -> list[Operario]:
    operarios = []
    for i in range(cantidad):
        velocidad = Velocidad(velocidad_metros_por_segundo)
        operarios.append(Operario(f"OP-{i+1:03d}", f"Operario {i+1}", velocidad, Carro(capacidad_carro)))
    return operarios


def crear_operarios_velocidades_distintas(cantidad: int, capacidad_carro: float = 30.0) -> list[Operario]:
    velocidades = [0.8, 1.0, 1.2, 1.5]
    operarios = []
    for i in range(cantidad):
        velocidad = Velocidad(velocidades[i % len(velocidades)])
        operarios.append(Operario(f"OP-{i+1:03d}", f"Operario {i+1}", velocidad, Carro(capacidad_carro)))
    return operarios
