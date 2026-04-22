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
        Producto("SKU-001", "Silla", 8.0, 3, 0),
        Producto("SKU-002", "Monitor", 4.0, 3, 4),
        Producto("SKU-003", "Teclado", 2.0, 6, 4),
        Producto("SKU-004", "Lampara", 3.0, 6, 0),
        Producto("SKU-005", "Mesa", 10.0, 0, 4),
    ]

    pedidos = [
        Pedido("PED-001", "Juan", {productos[1]: 1}),
        Pedido("PED-002", "Maria", {productos[2]: 2}),
        Pedido("PED-003", "Luis", {productos[3]: 1, productos[4]: 1}),
        Pedido("PED-004", "Ana", {productos[5]: 1}),
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

    viajes_total = sum(len(viajes) for viajes in resultado.asignacion.values())

    return {
        "caso": "basico",
        "tiempo_minimo_min": resultado.tiempo_minimo,
        "cantidad_pedidos": len(pedidos),
        "cantidad_operarios": len(operarios),
        "cantidad_viajes_total": viajes_total,
        "secuencia": [p.codigo for p in resultado.secuencia],
    }


if __name__ == "__main__":
    resultado = experimento()
    print(f"Caso: {resultado['caso']}")
    print(f"Tiempo mínimo: {resultado['tiempo_minimo_min']:.2f} min")
    print(f"Pedidos: {resultado['cantidad_pedidos']}")
    print(f"Operarios: {resultado['cantidad_operarios']}")
    print(f"Batches totales: {resultado['cantidad_batches_total']}")
