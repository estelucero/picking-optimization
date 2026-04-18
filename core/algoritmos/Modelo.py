from ..infrastructure.Carro import Carro
from ..interfaces.Heuristica import Heuristica
from ..infrastructure.Operario import Operario
from ..infrastructure.Pedido import Pedido
from ..infrastructure.Resultado import Resultado
from core.algoritmos.Tsp import TSP


class Modelo(Heuristica):
    """
    Heurística de asignación de pedidos sin criterio de urgencia.

    Asigna cada pedido al operario que queda con menor tiempo acumulado
    luego de recibirlo. Si el pedido no entra en el batch actual del
    operario elegido, se abre un nuevo batch.

    Se construye con un TSP que calcula las distancias de recorrido.
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

        pedidos_unitarios: list[list[Pedido]] = []
        nro_pedido: int = 1
        for pedido in pedidos:
            pedido.setCodigo(pedido.codigo + "_" +str(nro_pedido))
            pedido_unitario: list[Pedido] = [pedido]
            pedidos_unitarios.append(pedido_unitario)


        # Inicializar estado de cada operario
        tiempos: dict[Operario, float] = {op: 0.0 for op in operarios}
        carros: dict[Operario, Carro] = {
            op: Carro(op.carro.capacidad_max_peso) for op in operarios
        }
        secuencia: list[Pedido] = []

        for pedido_unitario in pedidos_unitarios:

            for pedido in pedido_unitario:
                secuencia.append(pedido)
                mejor_operario, mejor_tiempo = self._elegir_operario(
                    pedido, operarios, tiempos, carros, beta_picking
                )

                # Asignar pedido al operario elegido
                tiempos[mejor_operario] = mejor_tiempo
                carros[mejor_operario].agregar_pedido(pedido)

        tiempo_minimo = sum(tiempos.values())
        asignacion = {op: carros[op].batches for op in operarios}

        return Resultado(tiempo_minimo=tiempo_minimo, asignacion=asignacion, secuencia=secuencia)

    def _elegir_operario(
        self,
        pedido: Pedido,
        operarios: list[Operario],
        tiempos: dict[Operario, float],
        carros: dict[Operario, Carro],
        beta_picking: float,
    ) -> tuple[Operario, float]:
        """Retorna el operario y el tiempo estimado mínimo al asignarle el pedido."""
        mejor_operario = None
        mejor_tiempo = float("inf")

        for op in operarios:
            tiempo_estimado = self._calcular_tiempo_estimado(
                pedido, op, tiempos[op], carros[op], beta_picking
            )
            if tiempo_estimado < mejor_tiempo:
                mejor_tiempo = tiempo_estimado
                mejor_operario = op

        return mejor_operario, mejor_tiempo

    def _calcular_tiempo_estimado(
        self,
        pedido: Pedido,
        operario: Operario,
        tiempo_acumulado: float,
        carro: Carro,
        beta_picking: float,
    ) -> float:
        """
        Calcula el tiempo que tendría el operario si se le asigna el pedido.
        Usa el batch actual si el pedido entra, o un batch nuevo si no entra.
        """
        if carro.puede_agregar(pedido):
            batch_temporal = carro.batch_actual() | {pedido}
        else:
            batch_temporal = {pedido}

        distancia = self._tsp.calcular(batch_temporal)
        total_items = sum(p.total_items() for p in batch_temporal)
        t_batch = distancia.metros / operario.velocidad.metros_por_minuto + beta_picking * total_items

        return tiempo_acumulado + t_batch

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