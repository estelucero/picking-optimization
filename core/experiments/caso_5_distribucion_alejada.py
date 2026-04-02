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
        Producto("SKU-001", "Item 1", 2.0, 1, 1),
        Producto("SKU-002", "Item 2", 3.0, 50, 1),
        Producto("SKU-003", "Item 3", 1.5, 1, 50),
        Producto("SKU-004", "Item 4", 4.0, 50, 50),
        Producto("SKU-005", "Item 5", 2.5, 25, 25),
        Producto("SKU-006", "Item 6", 3.5, 100, 1),
        Producto("SKU-007", "Item 7", 1.0, 1, 100),
        Producto("SKU-008", "Item 8", 5.0, 100, 100),
        Producto("SKU-009", "Item 9", 2.0, 75, 25),
        Producto("SKU-010", "Item 10", 3.0, 25, 75),
    ]

    pedidos = [
        Pedido("PED-001", "Cliente 1", {productos[1]: 1, productos[6]: 1}),
        Pedido("PED-002", "Cliente 2", {productos[2]: 1, productos[7]: 1}),
        Pedido("PED-003", "Cliente 3", {productos[3]: 1, productos[8]: 1}),
        Pedido("PED-004", "Cliente 4", {productos[4]: 1, productos[9]: 1}),
        Pedido("PED-005", "Cliente 5", {productos[5]: 1, productos[10]: 1}),
        Pedido("PED-006", "Cliente 6", {productos[6]: 1, productos[1]: 1}),
        Pedido("PED-007", "Cliente 7", {productos[8]: 2}),
    ]

    velocidad = Velocidad(1.0)
    operarios = [
        Operario("OP-001", "Operario 1", velocidad, Carro(30.0)),
        Operario("OP-002", "Operario 2", velocidad, Carro(30.0)),
    ]

    grafo = Ubicaciones(productos)
    tsp = TSP(grafo, deposito="DEPOSITO")
    modelo = Modelo(tsp)

    resultado = modelo.resolver(pedidos, operarios, beta_picking=0.5)

    batches_total = sum(len(batches) for batches in resultado.asignacion.values())

    return {
        "caso": "distribucion_alejada",
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
