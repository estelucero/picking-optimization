# Utils - Utilidades y Value Objects

Este directorio contiene value objects para garantizar la correcta manipulación de unidades.

## Clases

### UnidadDistancia

Representa una distancia en metros. Es inmutable.

```python
from core.utils.UnidadDistancia import UnidadDistancia

distancia = UnidadDistancia(10.5)  # 10.5 metros

print(distancia.metros)    # 10.5
print(distancia.valor)     # 10.5
```

**Atributos (solo lectura):**
- `metros`: Valor en metros (float)
- `valor`: Alias de metros

**Validaciones:**
- Debe ser numérico
- No puede ser negativo

**Uso interno:**
- `core/infrastructure/Ubicaciones.distancia()` retorna esta clase
- `core/algoritmos/TSP.calcular()` retorna esta clase

---

### Velocidad

Representa una velocidad en metros por segundo. Es inmutable.

```python
from core.utils.Velocidad import Velocidad

velocidad = Velocidad(1.5)  # 1.5 m/s

print(velocidad.m_por_segundo)     # 1.5
print(velocidad.metros_por_minuto) # 90.0 (1.5 * 60)
print(velocidad.valor)             # 1.5
```

**Atributos (solo lectura):**
- `m_por_segundo`: Velocidad en m/s
- `metros_por_minuto`: Velocidad convertida a m/min (m/s × 60)
- `valor`: Alias de m_por_segundo

**Validaciones:**
- Debe ser numérico
- Debe ser mayor a 0

**Conversión:**
```python
# 1 m/s = 60 m/min
velocidad.metros_por_minuto  # Para usar en cálculos de tiempo
```
