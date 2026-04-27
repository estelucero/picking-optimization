from ..infrastructure.Producto import Producto
from ..interfaces.Heuristica import Heuristica
from ..infrastructure.Operario import Operario
from ..infrastructure.Pedido import Pedido
from ..infrastructure.Resultado import Resultado
from ..infrastructure.Viaje import Viaje
from core.algoritmos.Tsp import TSP
from core.utils.UnidadDistancia import UnidadDistancia


class Modelo(Heuristica):
    """
    Heurística de asignación de pedidos considerando viajes.

    Desempaqueta cada pedido en productos y los asigna a los operarios.
    Cuando el carro de un operario se llena, se inicia un nuevo viaje.
    """

    def __init__(self, tsp: TSP):
        if not isinstance(tsp, TSP):
            raise ValueError(f"Se esperaba un TSP, se recibió: {type(tsp)}")
        self._tsp = tsp

    def resolver(
        self,
        pedidos: list[Pedido],
        operarios: list[Operario],
        beta_picking: float,
    ) -> Resultado:
        self._validar_parametros(pedidos, operarios, beta_picking)

        productos = self._desempaquetar_pedidos(pedidos)

        tiempo_minimo = 0
        for producto, cantidad in productos:
            
            mejor_operario, mejor_tiempo, distancia, secuencia = self._elegir_operario(
                producto, cantidad, operarios, beta_picking
            )
            mejor_operario.agregar_tiempo(mejor_tiempo)
            self._agregar_producto(mejor_operario, producto, cantidad, mejor_tiempo, distancia)
    
        for op in operarios:
            #!A revisar
            if op.carro.peso_batch_actual() > 0:
                op.cerrar_viaje()
            # Calculate actual total time from completed trips instead of accumulated estimates
            for viaje in op.viajes:
                tiempo_minimo += viaje.tiempo

        asignacion = {op: op.viajes for op in operarios}

        return Resultado(tiempo_minimo=tiempo_minimo, asignacion=asignacion, secuencia=[])

    def _desempaquetar_pedidos(self, pedidos: list[Pedido]) -> list[tuple[Producto, int]]:
        """Desempaqueta todos los pedidos en una lista de (producto, cantidad)."""
        productos = []
        for pedido in pedidos:
            for producto, cantidad in pedido.items.items():
                productos.append((producto, cantidad))
        return productos

    def _elegir_operario(
        self,
        producto: Producto,
        cantidad: int,
        operarios: list[Operario],
        beta_picking: float,
    ) -> tuple[Operario, float,UnidadDistancia, list[str]]:
        """Retorna el operario y el tiempo estimado mínimo."""
        mejor_operario = None
        mejor_tiempo = float("inf")

        for op in operarios:
            tiempo_estimado, distancia, secuencia = self._calcular_tiempo_estimado(
                producto, cantidad, op, beta_picking
            )
            if tiempo_estimado < mejor_tiempo:
                mejor_tiempo = tiempo_estimado
                mejor_operario = op

        return mejor_operario, mejor_tiempo, distancia, secuencia

    def _calcular_tiempo_estimado(
        self,
        producto: Producto,
        cantidad: int,
        operario: Operario,
        beta_picking: float,
    ) -> tuple[float, UnidadDistancia, list[str]]:
        """Calcula el tiempo estimado si se agrega el producto."""
        carro = operario.carro
        peso_necesario = producto.peso * cantidad
        capacidad_restante = carro.capacidad_restante()

        tiempo = operario.tiempo_acumulado

        if peso_necesario <= capacidad_restante:
            batch_temporal = dict(carro.batch)
            batch_temporal[producto] = batch_temporal.get(producto, 0) + cantidad
            distancia_retorno = 0
        else:
            batch_temporal = {producto: cantidad}
            if carro.batch:
                distancia_retorno, secuencia = self._tsp.calcular_desde_productos(carro.batch)

        distancia, secuencia = self._tsp.calcular_desde_productos(batch_temporal)
        distancia = distancia.metros + distancia_retorno
        total_items = sum(batch_temporal.values())
        t_batch = distancia / operario.velocidad.metros_por_minuto + beta_picking * total_items

        
        return (tiempo + t_batch, distancia, secuencia)

    def _agregar_producto(
        self,
        operario: Operario,
        producto: Producto,
        cantidad: int,
        tiempo: float,
        distancia: float
    ) -> None:
        """Agrega un producto al carro del operario, cerrando viaje si está lleno."""
        carro_lleno = not (operario.puedo_agregar(producto, cantidad))

        if carro_lleno:
            operario.cerrar_viaje()
            #se vacia el carro lleno y se agrega el producto a un nuevo carro
            operario.agregar_producto(producto, cantidad, tiempo, distancia)
        else:
            operario.agregar_producto(producto, cantidad, tiempo, distancia)

    def _validar_parametros(
        self,
        pedidos: list[Pedido],
        operarios: list[Operario],
        beta_picking: float,
    ) -> None:
        if not isinstance(pedidos, list) or len(pedidos) == 0:
            raise ValueError("Se debe proveer una lista no vacía de pedidos")
        if not isinstance(operarios, list) or len(operarios) == 0:
            raise ValueError("Se debe proveer una lista no vacía de operarios")
        if not isinstance(beta_picking, (int, float)) or beta_picking < 0:
            raise ValueError(f"beta_picking debe ser un número no negativo, se recibió: {beta_picking}")