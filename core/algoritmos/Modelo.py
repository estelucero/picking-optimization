from ..infrastructure.Producto import Producto
from ..interfaces.Heuristica import Heuristica
from ..infrastructure.Operario import Operario
from ..infrastructure.Pedido import Pedido
from ..infrastructure.Resultado import Resultado
from ..infrastructure.Viaje import Viaje
from core.algoritmos.Tsp import TSP


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

        tiempos: dict[Operario, float] = {op: op.tiempo_acumulado for op in operarios}

        secuencia: list[Producto] = []

        for producto, cantidad in productos:
            secuencia.append(producto)
            mejor_operario, mejor_tiempo = self._elegir_operario(
                producto, cantidad, operarios, tiempos, beta_picking
            )

            tiempos[mejor_operario] = mejor_tiempo
            self._agregar_producto(mejor_operario, producto, cantidad, beta_picking)

        for op in operarios:
            if op.carro.peso_batch_actual() > 0:
                self._cerrar_viaje(op)

        tiempo_minimo = sum(tiempos.values())
        asignacion = {op: op.viajes for op in operarios}

        return Resultado(tiempo_minimo=tiempo_minimo, asignacion=asignacion, secuencia=secuencia)

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
        tiempos: dict[Operario, float],
        beta_picking: float,
    ) -> tuple[Operario, float]:
        """Retorna el operario y el tiempo estimado mínimo."""
        mejor_operario = None
        mejor_tiempo = float("inf")

        for op in operarios:
            tiempo_estimado = self._calcular_tiempo_estimado(
                producto, cantidad, op, tiempos[op], beta_picking
            )
            if tiempo_estimado < mejor_tiempo:
                mejor_tiempo = tiempo_estimado
                mejor_operario = op

        return mejor_operario, mejor_tiempo

    def _calcular_tiempo_estimado(
        self,
        producto: Producto,
        cantidad: int,
        operario: Operario,
        tiempo_acumulado: float,
        beta_picking: float,
    ) -> float:
        """Calcula el tiempo estimado si se agrega el producto."""
        carro = operario.carro
        peso_necesario = producto.peso * cantidad
        capacidad_restante = carro.capacidad_restante()

        tiempo = tiempo_acumulado

        if peso_necesario <= capacidad_restante:
            batch_temporal = dict(carro.batch)
            batch_temporal[producto] = batch_temporal.get(producto, 0) + cantidad
        else:
            batch_temporal = {producto: cantidad}
            if carro.batch:
                distancia_retorno, secuencia = self._tsp.calcular_desde_productos(carro.batch)
                tiempo += distancia_retorno.metros / operario.velocidad.metros_por_minuto

        distancia, secuencia = self._tsp.calcular_desde_productos(batch_temporal)
        total_items = sum(batch_temporal.values())
        t_batch = distancia.metros / operario.velocidad.metros_por_minuto + beta_picking * total_items

        return tiempo + t_batch

    def _agregar_producto(
        self,
        operario: Operario,
        producto: Producto,
        cantidad: int,
        beta_picking: float,
    ) -> None:
        """Agrega un producto al carro del operario, cerrando viaje si está lleno."""
        carro_lleno = operario.puedo_agregar(producto, cantidad)

        if carro_lleno:
            self._cerrar_viaje(operario)
            #se vacia el carro lleno y se agrega el producto a un nuevo carro
            operario.agregar_producto(producto, cantidad)
        else:
            operario.agregar_producto(producto, cantidad)

    def _cerrar_viaje(self, operario: Operario) -> None:
        """Cierra el viaje actual del operario (incluye retorno al depósito)."""
        carro = operario.carro
        if carro.peso_batch_actual() == 0:
            return

        distancia, secuencia = self._tsp.calcular_desde_productos(carro.batch)
        tiempo_viaje = distancia.metros / operario.velocidad.metros_por_minuto

        viaje = Viaje(carro.batch, distancia.metros, tiempo_viaje, secuencia, carro.capacidad_usada)
        operario.agregar_viaje(viaje)
        #vaciar carrito
        carro.vaciar()

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