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
            # mejor_operario.agregar_tiempo(mejor_tiempo)
            self._agregar_producto(mejor_operario, producto, cantidad, mejor_tiempo, distancia, secuencia)
    
        for op in operarios:
            #!A revisar
            if op.carro.peso_batch_actual() > 0:
                op.cerrar_viaje()
            
            for viaje in op.viajes:
                tiempo_minimo += viaje.tiempo

        asignacion = {op: op.viajes for op in operarios}

        return Resultado(tiempo_minimo=tiempo_minimo, asignacion=asignacion)

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

        #Tiempo proyectado = tiempo acumulado + tiempo batch actual
        for op in operarios:
            tiempo_estimado, distancia, secuencia = self._calcular_tiempo_estimado(
                producto, cantidad, op, beta_picking
            )
            if tiempo_estimado + op.tiempo_acumulado < mejor_tiempo:
                mejor_tiempo = tiempo_estimado + op.tiempo_acumulado
                mejor_operario = op
                mejor_distancia = distancia
                mejor_secuencia = secuencia

        return mejor_operario, mejor_tiempo, mejor_distancia, mejor_secuencia

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
        distancia_acumulada: UnidadDistancia = UnidadDistancia(metros=0)

        if peso_necesario <= capacidad_restante:
            batch_temporal = dict(carro.batch)
            batch_temporal[producto] = batch_temporal.get(producto, 0) + cantidad
        else:
            #TODO: Que pasa si supera la capacidad?
            batch_temporal_acumulado = dict(carro.batch)
            distancia_acumulada, secuencia = self._tsp.calcular_desde_productos(batch_temporal_acumulado)
            batch_temporal = {producto: cantidad}

        distancia, secuencia = self._tsp.calcular_desde_productos(batch_temporal)
        distancia_total_metros = distancia.metros + distancia_acumulada.metros
        total_items = sum(batch_temporal.values())
        t_batch = distancia_total_metros / operario.velocidad.metros_por_minuto + beta_picking * total_items

        
        return (t_batch, UnidadDistancia(metros=distancia_total_metros), secuencia)

    def _agregar_producto(
        self,
        operario: Operario,
        producto: Producto,
        cantidad: int,
        tiempo: float,
        distancia: float,
        secuencia : list[str]
    ) -> None:
        """Agrega un producto al carro del operario, cerrando viaje si está lleno."""
        carro_lleno = not (operario.puedo_agregar(producto, cantidad))

        if carro_lleno:
            operario.cerrar_viaje()
            #se vacia el carro lleno y se agrega el producto a un nuevo carro
            operario.agregar_producto(producto, cantidad, tiempo, distancia, secuencia)
        else:
            operario.agregar_producto(producto, cantidad, tiempo, distancia, secuencia)

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