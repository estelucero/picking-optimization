from core.infrastructure.Producto import Producto
from core.infrastructure.Ubicaciones import Ubicaciones
from core.infrastructure.Pedido import Pedido
from core.infrastructure.Carro import Carro
from core.infrastructure.Operario import Operario
from core.algoritmos.Tsp import TSP
from core.algoritmos.Modelo import Modelo
from core.utils.Velocidad import Velocidad


def experimento():
    productos = [
        Producto("DEPOSITO", "Deposito", 1.0, 0, 0),
        Producto("SKU-001", "Heladera", 80.0, 2, 2),
        Producto("SKU-002", "Lavarropa", 65.0, 4, 2),
        Producto("SKU-003", "Secadora", 50.0, 6, 2),
        Producto("SKU-004", "Cocina", 70.0, 2, 4),
        Producto("SKU-005", "Freezer", 90.0, 4, 4),
        Producto("SKU-006", "Microondas", 15.0, 6, 4),
        Producto("SKU-007", "Calefactor", 10.0, 2, 6),
        Producto("SKU-008", "Aire", 45.0, 4, 6),
    ]

    pedidos = [
        Pedido("PED-001", "Cliente A", {productos[1]: 1}),
        Pedido("PED-002", "Cliente B", {productos[2]: 1}),
        Pedido("PED-003", "Cliente C", {productos[3]: 1, productos[6]: 2}),
        Pedido("PED-004", "Cliente D", {productos[4]: 1, productos[5]: 1}),
        Pedido("PED-005", "Cliente E", {productos[7]: 1}),
        Pedido("PED-006", "Cliente F", {productos[8]: 1}),
    ]

    velocidad = Velocidad(1.0)
    capacidad_carro = 200.0
    operarios = [
        Operario("OP-001", "Operario 1", velocidad, Carro(capacidad_carro)),
        Operario("OP-002", "Operario 2", velocidad, Carro(capacidad_carro)),
    ]

    grafo = Ubicaciones(productos)
    tsp = TSP(grafo, deposito="DEPOSITO")
    modelo = Modelo(tsp)

    resultado = modelo.resolver(pedidos, operarios, beta_picking=0.5)

    batches_total = sum(len(batches) for batches in resultado.asignacion.values())

    return {
        "caso": "productos_pesados",
        "tiempo_minimo_min": resultado.tiempo_minimo,
        "cantidad_pedidos": len(pedidos),
        "cantidad_operarios": len(operarios),
        "cantidad_batches_total": batches_total,
        "secuencia": [p.codigo for p in resultado.secuencia],
    }


if __name__ == "__main__":
    resultado = experimento()
    print(f"Caso: {resultado['caso']}")
    print(f"Tiempo mínimo: {resultado['tiempo_minimo_min']:.2f} min")
    print(f"Pedidos: {resultado['cantidad_pedidos']}")
    print(f"Operarios: {resultado['cantidad_operarios']}")
    print(f"Batches totales: {resultado['cantidad_batches_total']}")
