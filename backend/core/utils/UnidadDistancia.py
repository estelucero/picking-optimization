from pydantic import BaseModel, Field

class UnidadDistancia(BaseModel):
    metros: float = Field(...,ge=0)
    model_config = {"frozen": True}

    @property
    def valor(self) -> float:
        return self.metros
