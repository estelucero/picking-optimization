from pydantic import BaseModel, Field

class Velocidad(BaseModel):
    #El campo es obligatorio y tiene que ser mayor a 0
    m_por_segundo: float = Field(...,gt=0)
    #Para que sea inmutable la velocidad
    model_config = {"frozen": True}

    @property
    def metros_por_minuto(self) -> float:
        return self.m_por_segundo * 60

    @property
    def valor(self) -> float:
        return self.m_por_segundo
