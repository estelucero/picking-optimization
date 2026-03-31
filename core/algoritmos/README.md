# Algoritmos - Algoritmos y Heurísticas

Este directorio contiene los algoritmos de optimización del sistema.

## Clases

### TSP (Traveling Salesman Problem)

Implementa el problema del viajante usando la heurística del **vecino más cercano**.

```python
from core.algoritmos.Tsp import TSP
from core.infrastructure.Ubicaciones import Ubicaciones

grafo = Ubicaciones(productos)
tsp = TSP(grafo, deposito="DEPOSITO")

distancia = tsp.calcular({pedido1, pedido2})
# Retorna UnidadDistancia (metros totales del recorrido)
```

**Descripción:**
- Recibe un grafo de ubicaciones y un depósito
- Para un batch de pedidos, calcula la distancia total del recorrido
- Usa el vecino más cercano: desde la posición actual, va al nodo más cercano
- Termina volviendo al depósito

**Método:**
- `calcular(batch: set[Pedido]) -> UnidadDistancia`

**Retorna:**
- UnidadDistancia con la distancia total en metros (ida y vuelta al depósito)

---

### Modelo (Heurística de Asignación)

Heurística de asignación de pedidos sin criterio de urgencia.

```python
from core.algoritmos.Modelo import Modelo

modelo = Modelo(tsp)
resultado = modelo.resolver(pedidos, operarios, beta_picking=0.5)
```

**Descripción:**
- Asigna cada pedido al operario con menor tiempo acumulado
- Si el pedido no entra en el batch actual, abre uno nuevo
- El tiempo se calcula como:
  ```
  t_batch = distancia(m) / velocidad(m/min) + beta_picking * items
  ```

**Parámetros:**
- `pedidos`: Lista de Pedido a procesar
- `operarios`: Lista de Operario disponibles
- `beta_picking`: Tiempo por item en minutos (default sugerido: 0.5)

**Retorna:**
- Resultado con tiempo_minimo, asignacion y secuencia

---

## Flujo del Algoritmo

```
1. Crear productos con coordenadas (x, y en metros)
2. Crear pedidos con productos
3. Crear operarios con Velocidad (m/s) y Carro (capacidad kg)
4. Construir Ubicaciones (grafo)
5. Crear TSP con grafo y depósito
6. Crear Modelo con TSP
7. Ejecutar modelo.resolver()
8. Obtener resultado.tiempo_minimo (en minutos)
```
