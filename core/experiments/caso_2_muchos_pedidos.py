from core.infrastructure.Ubicaciones import Ubicaciones
from core.algoritmos.Tsp import TSP
from core.algoritmos.Modelo import Modelo
from generadores import crear_productos_grid, crear_pedidos_desde_productos, crear_operarios


def experimento():
    productos = crear_productos_grid(30, "Item")
    pedidos = crear_pedidos_desde_productos(productos, cantidad_pedidos=20, items_por_pedido=(1, 3))
    operarios = crear_operarios(cantidad=3, velocidad_metros_por_segundo=1.0, capacidad_carro=30.0)

    grafo = Ubicaciones(productos=productos)
    tsp = TSP(grafo=grafo, deposito="DEPOSITO")
    modelo = Modelo(tsp=tsp)

    resultado = modelo.resolver(pedidos, operarios, beta_picking=0.5)

    viajes_total = sum(len(viajes) for viajes in resultado.asignacion.values())

    return {
        "caso": "muchos_pedidos",
        "tiempo_minimo_min": resultado.tiempo_minimo,
        "cantidad_pedidos": len(pedidos),
        "cantidad_operarios": len(operarios),
        "cantidad_viajes_total": viajes_total,
        # "secuencia": [p.codigo for p in resultado.secuencia],
        "mapa_operarios": resultado.asignacion
    }


if __name__ == "__main__":
    resultado = experimento()
    print(f"Caso: {resultado['caso']}")
    print(f"Tiempo mínimo: {resultado['tiempo_minimo_min']:.2f} min")
    print(f"Pedidos: {resultado['cantidad_pedidos']}")
    print(f"Operarios: {resultado['cantidad_operarios']} ")
    print(f"cantidad_viajes_total: {resultado['cantidad_viajes_total']} \n")
    print(f" Operarios: {resultado['mapa_operarios']} \n")
