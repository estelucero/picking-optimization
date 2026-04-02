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

Heurística golosa (greedy) para asignar pedidos a operarios minimizando el tiempo total.

**Firma:**
```python
def resolver(self, pedidos: list[Pedido], operarios: list[Operario], beta_picking: float) -> Resultado
```

**Recibimos:**
- `pedidos`: Lista de pedidos a procesar (en un orden específico)
- `operarios`: Lista de operarios con velocidad y capacidad de carro
- `beta_picking`: Tiempo extra por cada item en el picking (minutos)

---

**Cómo funciona internamente (paso a paso):**

**Paso 1 - Inicialización:**
- Creamos un diccionario `tiempos` que registra el tiempo acumulado de cada operario (inicia en 0)
- Creamos un diccionario `carros` con un carro vacío por operario (misma capacidad)
- Creamos una lista `secuencia` vacía para registrar el orden de procesamiento

**Paso 2 - Procesamiento de cada pedido:**

Para cada pedido de la lista (en orden):

**2.1. Agregamos el pedido a la secuencia**
- Registramos que este pedido fue procesado

**2.2. Evaluamos cada operario:**

Para cada operario, simulamos qué pasaría si le asignamos el pedido:

- ¿Entra en el batch actual? Verificamos si el peso del pedido + peso actual del batch ≤ capacidad del carro
- Creamos un batch "mental" con los pedidos del batch actual ± el nuevo pedido
- Calculamos la distancia de ese batch usando TSP (recorrido completo)
- Calculamos el tiempo del batch:
  ```
  distancia(m) / velocidad(m/min) + beta_picking * cantidad_items
  ```
- Tiempo estimado del operario = tiempo_acumulado + tiempo_batch

**2.3. Elegimos el mejor operario**
- Nos quedamos con el operario que tenga el menor tiempo estimado

**2.4. Asignamos el pedido al operario elegido**
- Incrementamos `tiempos[operario]` con el nuevo tiempo_batch
- Agregamos el pedido al carro (el carro decide si crea un nuevo batch o no)

**Paso 3 - Finalización:**

- `tiempo_minimo` = suma de todos los tiempos de los operarios
- `asignacion` = los batches de cada operario (del diccionario de carros)
- `secuencia` = orden en que se procesaron los pedidos

---

**Retorna:**
- Objeto `Resultado` con:
  - `tiempo_minimo`: suma de tiempos de todos los operarios (minutos)
  - `asignacion`: dict {Operario: list[set[Pedido]]} batches por operario
  - `secuencia`: orden en que se procesaron los pedidos

---

**Ejemplo visual simplificado:**

```
Pedidos: [P1, P2, P3]
Operarios: [OP1, OP2]

Inicialización:
  OP1: tiempo=0, batch_actual={}
  OP2: tiempo=0, batch_actual={}

Procesar P1:
  Evaluar OP1: t_batch=10min → tiempo_total=10
  Evaluar OP2: t_batch=10min → tiempo_total=10
  → Elegir OP1 (empate, se elige el primero)
  Asignar P1 a OP1

Procesar P2:
  Evaluar OP1: entra en batch, t_batch=8min → tiempo_total=18
  Evaluar OP2: t_batch=10min → tiempo_total=10
  → Elegir OP2 (menor tiempo)
  Asignar P2 a OP2

Procesar P3:
  Evaluar OP1: entra en batch, t_batch=8min → tiempo_total=26
  Evaluar OP2: no entra, nuevo batch, t_batch=12min → tiempo_total=22
  → Elegir OP2
  Asignar P3 a OP2 (nuevo batch)

Resultado:
  tiempo_minimo = 26 + 22 = 48 min
  OP1: batch1={P1}
  OP2: batch1={P2}, batch2={P3}
```

---

**Notas importantes:**
- La heurística es "golosa" (greedy): toma la mejor decisión local en cada paso
- No busca la solución óptima global, sino una solución buena en tiempo razonable
- El orden de los pedidos afecta el resultado final
- Los batches se crean automáticamente según la capacidad del carro
