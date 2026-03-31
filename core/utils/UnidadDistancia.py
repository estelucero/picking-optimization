from dataclasses import dataclass


@dataclass(frozen=True)
class UnidadDistancia:
    metros: float

    def __post_init__(self):
        if not isinstance(self.metros, (int, float)):
            raise ValueError(f"El valor debe ser numérico, se recibió: {type(self.metros)}")
        if self.metros < 0:
            raise ValueError(f"La distancia no puede ser negativa, se recibió: {self.metros}")

    @property
    def valor(self) -> float:
        return self.metros
