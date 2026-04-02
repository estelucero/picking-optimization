from dataclasses import dataclass


@dataclass(frozen=True)
class Velocidad:
    m_por_segundo: float

    def __post_init__(self):
        if not isinstance(self.m_por_segundo, (int, float)):
            raise ValueError(f"El valor debe ser numérico, se recibió: {type(self.m_por_segundo)}")
        if self.m_por_segundo <= 0:
            raise ValueError(f"La velocidad debe ser mayor a 0, se recibió: {self.m_por_segundo}")

    @property
    def metros_por_minuto(self) -> float:
        return self.m_por_segundo * 60

    @property
    def valor(self) -> float:
        return self.m_por_segundo
