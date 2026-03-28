from producto import Producto


class Pedido:
    """
    Representa un pedido de un cliente en el depósito.

    Atributos:
    - codigo: identificador único del pedido (ej: "PED-001")
    - cliente: nombre o identificador del cliente
    - items: diccionario {Producto: cantidad} con los productos solicitados
    """

    def __init__(self, codigo: str, cliente: str, items: dict[Producto, int]):
        self._validar_string(codigo, "código")
        self._validar_string(cliente, "cliente")
        self._validar_items(items)

        self._codigo = codigo.strip()
        self._cliente = cliente.strip()
        self._items = dict(items)

    def _validar_string(self, valor: str, campo: str) -> None:
        if not isinstance(valor, str) or not valor.strip():
            raise ValueError(f"El {campo} debe ser un string no vacío, se recibió: '{valor}'")

    def _validar_items(self, items: dict) -> None:
        if not isinstance(items, dict) or len(items) == 0:
            raise ValueError("El pedido debe tener al menos un producto")
        for producto, cantidad in items.items():
            if not isinstance(producto, Producto):
                raise ValueError(f"Las claves deben ser Producto, se recibió: {type(producto)}")
            if not isinstance(cantidad, int) or cantidad <= 0:
                raise ValueError(
                    f"La cantidad del producto '{producto.codigo}' debe ser un entero mayor a 0, "
                    f"se recibió: {cantidad}"
                )

    @property
    def codigo(self) -> str:
        return self._codigo

    @property
    def cliente(self) -> str:
        return self._cliente

    @property
    def items(self) -> dict[Producto, int]:
        return dict(self._items)

    def total_items(self) -> int:
        """Retorna la cantidad total de ítems del pedido."""
        return sum(self._items.values())

    def productos(self) -> set[Producto]:
        """Retorna el conjunto de productos del pedido (sin cantidades)."""
        return set(self._items.keys())

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Pedido):
            return False
        return self._codigo == other._codigo

    def __hash__(self) -> int:
        return hash(self._codigo)

    def __repr__(self) -> str:
        return (
            f"Pedido(codigo='{self._codigo}', cliente='{self._cliente}', "
            f"total_items={self.total_items()})"
        )