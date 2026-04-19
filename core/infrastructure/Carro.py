from .Producto import Producto


class Carro:
    """
    Representa el carro de picking de un operario.

    Maneja los batch de productos asignados y controla
    que el peso total no supere la capacidad máxima.

    Atributos:
    - capacidad_max_peso: peso máximo que soporta el carro en kg
    - batch: productos que tiene el carro
    """
    capacidad_max_peso:float
    batch:dict[Producto, int]
    capacidad_usada:int

    def __init__(self):
        self._capacidad_max_peso = 0
        self.capacidad_usada = 0
        self._batch: dict[Producto,int] = {}

    @property
    def capacidad_max_peso(self) -> float:
        return self._capacidad_max_peso

    @property
    def batch(self) -> dict[Producto,int]:
        return [set(batch) for batch in self._batch]

    def peso_batch_actual(self) -> float:
        """Retorna el peso total acumulado en el batch actual."""
        return self.capacidad_usada
    
    def capacidad_restante(self) -> float:
        """Retorna la capacidad restante del carro"""
        return self.capacidad_max_peso - self.capacidad_usada

    def puede_agregar(self, producto: Producto, cantidad: int) -> bool:
        """Indica si el producto con esa cantidad se puede agregar."""
        if not isinstance(producto, Producto):
            raise ValueError(f"Se esperaba un Pedido, se recibió: {type(pedido)}")
        peso_nuevo = (producto.peso * cantidad) + self.capacidad_usada
        return peso_nuevo <= self.capacidad_max_peso 

    def agregar_producto(self, producto: Producto, cantidad:int) -> None:
        """
        Agrega un producto al carro.
        """
        if not isinstance(producto, Producto):
            raise ValueError(f"Se esperaba un Producto, se recibió: {type(producto)}")
        
        peso_nuevo = producto.peso * cantidad
        if not self.puede_agregar(producto, cantidad):
            raise ValueError(
                f"El pedido '{producto.codigo}' supera por sí solo la capacidad del carro "
                f"({peso_nuevo}kg > {self._capacidad_max_peso}kg)"
            )

        if producto in self._batch:
            self._batch[producto] += cantidad
        else:
            self._batch[producto] = cantidad
        
        self.capacidad_usada += producto.peso * cantidad
        

    def __repr__(self) -> str:
        return (
            f"Carro(capacidad_max_peso={self._capacidad_max_peso}kg, "
            f"batch={self.batch}, "
            f"peso_actual={self.capacidad_usada}kg)"
        )