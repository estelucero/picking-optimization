from core.infrastructure.Producto import Producto
from core.infrastructure.Ubicaciones import Ubicaciones
from core.infrastructure.Pedido import Pedido
from core.infrastructure.Carro import Carro
from core.infrastructure.Operario import Operario
from core.algoritmos.Tsp import TSP
from core.algoritmos.Modelo import Modelo
from core.utils.Velocidad import Velocidad


def main():
    productos = [
        Producto(codigo="DEPOSITO", nombre="Deposito",peso= 1.0, x=0, y=0),
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

    velocidad = Velocidad(m_por_segundo=1.0)  # 1 m/s
    operarios = [
        Operario(codigo="OP-001", nombre="Operario 1", velocidad=velocidad, carro=Carro(capacidad_max_peso=30.0)),
        Operario(codigo="OP-002", nombre="Operario 2", velocidad=velocidad, carro=Carro(capacidad_max_peso=30.0)),
    ]

    grafo = Ubicaciones(productos=productos)
    tsp = TSP(grafo=grafo, deposito="DEPOSITO")
    modelo = Modelo(tsp)

    import time
    inicio = time.time()
    resultado = modelo.resolver(pedidos, operarios, beta_picking=0.5)
    fin = time.time()

    print(f"Tiempo de ejecucion: {(fin - inicio) * 1000:.2f} ms")
    print(f"Tiempo minimo total: {resultado.tiempo_minimo:.2f} minutos")
    print(f"Secuencia: {[p.codigo for p in resultado.secuencia]}")

    for op, viajes in resultado.asignacion.items():
        print(f"\n{op.codigo}:")
        for i, viaje in enumerate(viajes):
            productos_info = [(p.codigo, cant) for p, cant in viaje.secuencia]
            print(f"  Viaje {i+1}: productos={productos_info}, distancia={viaje.distancia.metros}m, tiempo={viaje.tiempo:.2f}min")


if __name__ == "__main__":
    main()
