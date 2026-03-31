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

    velocidad = Velocidad(1.0)  # 1 m/s
    operarios = [
        Operario("OP-001", "Operario 1", velocidad, Carro(30.0)),
        Operario("OP-002", "Operario 2", velocidad, Carro(30.0)),
    ]

    grafo = Ubicaciones(productos)
    tsp = TSP(grafo, deposito="DEPOSITO")
    modelo = Modelo(tsp)

    import time
    inicio = time.time()
    resultado = modelo.resolver(pedidos, operarios, beta_picking=0.5)
    fin = time.time()

    print(f"Tiempo de ejecucion: {(fin - inicio) * 1000:.2f} ms")
    print(f"Tiempo minimo total: {resultado.tiempo_minimo:.2f} minutos")
    print(f"Secuencia: {[p.codigo for p in resultado.secuencia]}")

    for op, batches in resultado.asignacion.items():
        print(f"\n{op.codigo}:")
        for i, batch in enumerate(batches):
            print(f"  Batch {i+1}: {[p.codigo for p in batch]}")


if __name__ == "__main__":
    main()
