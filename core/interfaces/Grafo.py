
from abc import ABC, abstractmethod
class Grafo(ABC):
    
    @abstractmethod
    def distancia(self, origen: str, destino: str) -> float:
        """Retorna la distancia entre dos ubicaciones."""
        pass
 
    @abstractmethod
    def nodos(self) -> set:
        """Retorna el conjunto de todas las ubicaciones del grafo."""
        pass