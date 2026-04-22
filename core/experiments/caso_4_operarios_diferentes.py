from core.infrastructure.Ubicaciones import Ubicaciones
from core.algoritmos.Tsp import TSP
from core.algoritmos.Modelo import Modelo
from .generadores import crear_productos_grid, crear_pedidos_desde_productos, crear_operarios_velocidades_distintas


def experimento():
    productos = crear_productos_grid(25, "Articulo")
    pedidos = crear_pedidos_desde_productos(productos, cantidad_pedidos=15, items_por_pedido=(1, 3))
    operarios = crear_operarios_velocidades_distintas(cantidad=4, capacidad_carro=30.0)

    grafo = Ubicaciones(productos)
    tsp = TSP(grafo, deposito="DEPOSITO")
    modelo = Modelo(tsp)

    resultado = modelo.resolver(pedidos, operarios, beta_picking=0.5)

    viajes_total = sum(len(viajes) for viajes in resultado.asignacion.values())

    return {
        "caso": "operarios_diferentes",
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
