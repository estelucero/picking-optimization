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
        Producto(codigo="DEPOSITO", nombre="Deposito", peso=1.0, x=0, y=0),
        Producto(codigo="SKU-001", nombre="Silla", peso=8.0, x=3, y=0),
        Producto(codigo="SKU-002", nombre="Monitor", peso=4.0, x=3, y=4),
        Producto(codigo="SKU-003", nombre="Teclado", peso=2.0, x=6, y=4),
        Producto(codigo="SKU-004", nombre="Lampara", peso=3.0, x=6, y=0),
        Producto(codigo="SKU-005", nombre="Mesa", peso=10.0, x=0, y=4),
    ]

    pedidos = [
        Pedido(codigo="PED-001", cliente="Juan", items={productos[1]: 1}),
        Pedido(codigo="PED-002", cliente="Maria", items={productos[2]: 2}),
        Pedido(codigo="PED-003", cliente="Luis", items={productos[3]: 1, productos[4]: 1}),
        Pedido(codigo="PED-004", cliente="Ana", items={productos[5]: 1}),
    ]

    velocidad = Velocidad(m_por_segundo=1.0)
    operarios = [
        Operario(codigo="OP-001", nombre="Operario 1", velocidad=velocidad, carro=Carro(capacidad_max_peso=30.0)),
        Operario(codigo="OP-002", nombre="Operario 2", velocidad=velocidad, carro=Carro(capacidad_max_peso=30.0)),
    ]

    grafo = Ubicaciones(productos=productos)
    tsp = TSP(grafo=grafo, deposito="DEPOSITO")
    modelo = Modelo(tsp)

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
