from abc import ABC, abstractmethod

from ..infrastructure.Operario import Operario
from ..infrastructure.Pedido import Pedido
from ..infrastructure.Resultado import Resultado


class Heuristica(ABC):
    """
    Interfaz que define el contrato de cualquier heurística
    o metaheurística de asignación de pedidos.
    """

    @abstractmethod
    def resolver(
        self,
        pedidos: list[Pedido],
        operarios: list[Operario],
        beta_picking: float,
    ) -> Resultado:
        """
        Asigna los pedidos a los operarios y retorna el resultado.

        Parámetros:
        - pedidos: lista de pedidos a asignar
        - operarios: lista de operarios disponibles
        - beta_picking: tiempo en minutos por ítem recogido

        Retorna:
        - Resultado con z*, asignación de batches y secuencia usada
        """
        pass