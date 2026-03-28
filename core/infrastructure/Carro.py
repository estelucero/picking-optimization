from pedido import Pedido


class Carro:
    """
    Representa el carro de picking de un operario.

    Maneja los batches de pedidos asignados y controla
    que el peso total no supere la capacidad máxima.

    Atributos:
    - capacidad_max_peso: peso máximo que soporta el carro en kg
    - batches: lista de sets de pedidos, cada set es un viaje
    """

    def __init__(self, capacidad_max_peso: float):
        if not isinstance(capacidad_max_peso, (int, float)) or capacidad_max_peso <= 0:
            raise ValueError(
                f"La capacidad máxima de peso debe ser un número mayor a 0, "
                f"se recibió: {capacidad_max_peso}"
            )
        self._capacidad_max_peso = float(capacidad_max_peso)
        self._batches: list[set[Pedido]] = [set()]

    @property
    def capacidad_max_peso(self) -> float:
        return self._capacidad_max_peso

    @property
    def batches(self) -> list[set[Pedido]]:
        return [set(batch) for batch in self._batches]

    def batch_actual(self) -> set[Pedido]:
        """Retorna el batch en el que se está trabajando actualmente."""
        return set(self._batches[-1])

    def peso_batch_actual(self) -> float:
        """Retorna el peso total acumulado en el batch actual."""
        return sum(
            producto.peso * cantidad
            for pedido in self._batches[-1]
            for producto, cantidad in pedido.items.items()
        )

    def puede_agregar(self, pedido: Pedido) -> bool:
        """Indica si el pedido entra en el batch actual sin superar la capacidad."""
        if not isinstance(pedido, Pedido):
            raise ValueError(f"Se esperaba un Pedido, se recibió: {type(pedido)}")
        peso_pedido = sum(p.peso * c for p, c in pedido.items.items())
        return self.peso_batch_actual() + peso_pedido <= self._capacidad_max_peso

    def agregar_pedido(self, pedido: Pedido) -> None:
        """
        Agrega un pedido al batch actual si entra, o abre un nuevo batch si no.
        """
        if not isinstance(pedido, Pedido):
            raise ValueError(f"Se esperaba un Pedido, se recibió: {type(pedido)}")

        peso_pedido = sum(p.peso * c for p, c in pedido.items.items())
        if peso_pedido > self._capacidad_max_peso:
            raise ValueError(
                f"El pedido '{pedido.codigo}' supera por sí solo la capacidad del carro "
                f"({peso_pedido}kg > {self._capacidad_max_peso}kg)"
            )

        if not self.puede_agregar(pedido):
            self._batches.append(set())

        self._batches[-1].add(pedido)

    def total_batches(self) -> int:
        """Retorna la cantidad de batches (viajes) del carro."""
        return len(self._batches)

    def __repr__(self) -> str:
        return (
            f"Carro(capacidad_max_peso={self._capacidad_max_peso}kg, "
            f"batches={self.total_batches()}, "
            f"peso_actual={self.peso_batch_actual()}kg)"
        )