from pydantic import BaseModel
from core.algoritmos.Modelo import Modelo
from core.algoritmos.Tsp import TSP
from core.infrastructure.Ubicaciones import Ubicaciones
from core.infrastructure.Generador import Generador

class ExperimentoService(BaseModel):
    tamaño_matriz: int
    cantidad_pedidos: int
    cantidad_operarios: int
    iteraciones: int


    @classmethod
    def promedio_experimentos(self):
        generador: Generador = Generador()
        tamañoMatriz = self.tamaño_matriz
        productos = generador.crear_productos_grid(cantidad=tamañoMatriz, nombre="Item")
        pedidos = generador.crear_pedidos_desde_productos(productos=productos, cantidad_pedidos=self.cantidad_pedidos, items_por_pedido=(1, 3))
        operarios = generador.crear_operarios(cantidad=self.cantidad_operarios, velocidad_metros_por_segundo=1.0, capacidad_carro=30.0)

        grafo = Ubicaciones(productos=productos)
        tsp = TSP(grafo=grafo, deposito="DEPOSITO")
        modelo = Modelo(tsp=tsp)

        resultado = modelo.resolver(pedidos, operarios, beta_picking=0.5)

        print(f"Caso: experimento")
        print(f"Tiempo mínimo: {resultado.tiempo_minimo:.2f} min")
        print(f"Pedidos: {len(pedidos)}")
        print(f"Operarios: {len(operarios)} ")
        print(f" Operarios: {resultado.asignacion} \n")
