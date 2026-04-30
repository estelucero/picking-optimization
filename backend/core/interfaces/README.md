# Interfaces - Contratos Abstractos

Este directorio contiene las interfaces/contratos que definen el comportamiento esperado.

## Clases

### Grafo (Abstract)

Define el contrato para implementaciones de grafo.

```python
from core.interfaces.Grafo import Grafo

class MiGrafo(Grafo):
    def distancia(self, origen: str, destino: str) -> float:
        # Implementación
        pass
    
    def nodos(self) -> set:
        # Implementación
        pass
```

**Métodos abstractos:**
- `distancia(origen, destino)`: Retorna distancia entre dos nodos
- `nodos()`: Retorna conjunto de todos los nodos

**Implementación disponible:**
- `core/infrastructure/Ubicaciones.py`: Usa distancia Manhattan

---

### Heuristica (Abstract)

Define el contrato para heurísticas de asignación.

```python
from core.interfaces.Heuristica import Heuristica

class MiHeuristica(Heuristica):
    def resolver(self, pedidos, operarios, beta_picking) -> Resultado:
        # Implementación
        pass
```

**Métodos abstractos:**
- `resolver(pedidos, operarios, beta_picking) -> Resultado`

**Implementación disponible:**
- `core/algoritmos/Modelo.py`: Heurística de asignación por menor tiempo
