# Infrastructure - Entidades del Dominio

Este directorio contiene las entidades del dominio del sistema de picking.

## Clases

### Producto

Representa un producto en el depósito. Cada producto tiene una ubicación (x, y) en metros.

```python
from core.infrastructure.Producto import Producto

producto = Producto("SKU-001", "Silla", 8.0, 3, 0)
# codigo="SKU-001", nombre="Silla", peso=8.0kg, x=3m, y=0m
```

**Atributos:**
- `codigo`: Identificador único
- `nombre`: Nombre descriptivo
- `peso`: Peso en kg
- `x`, `y`: Coordenadas en metros

---

### Pedido

Representa un pedido de un cliente.

```python
from core.infrastructure.Pedido import Pedido

pedido = Pedido("PED-001", "Juan", {producto: 2})
# Código="PED-001", cliente="Juan", 2 unidades del producto
```

**Atributos:**
- `codigo`: Identificador único
- `cliente`: Nombre del cliente
- `items`: Dict {Producto: cantidad}

**Métodos:**
- `total_items()`: Cantidad total de items
- `productos()`: Set de productos únicos

---

### Carro

Carro de picking con capacidad máxima de peso.

```python
from core.infrastructure.Carro import Carro

carro = Carro(30.0)  # Capacidad de 30kg
carro.agregar_pedido(pedido)
```

**Atributos:**
- `capacidad_max_peso`: Peso máximo en kg

**Métodos:**
- `agregar_pedido(pedido)`: Agrega pedido (crea nuevo batch si no entra)
- `puede_agregar(pedido)`: Verifica si el pedido cabe
- `batch_actual()`: Set de pedidos en el batch actual
- `batches`: Lista de todos los batches
- `peso_batch_actual()`: Peso acumulado en batch actual

---

### Operario

Operario del depósito con velocidad y carro asignado.

```python
from core.infrastructure.Operario import Operario
from core.utils.Velocidad import Velocidad

velocidad = Velocidad(1.0)  # 1 m/s
operario = Operario("OP-001", "Juan", velocidad, Carro(30.0))
```

**Atributos:**
- `codigo`: Identificador único
- `nombre`: Nombre del operario
- `velocidad`: Objeto Velocidad (m/s)
- `carro`: Carro asignado
- `tiempo_acumulado`: Tiempo total acumulado

**Métodos:**
- `agregar_tiempo(minutos)`: Suma tiempo al acumulado

---

### Ubicaciones

Grafo que representa las ubicaciones de productos con distancias Manhattan.

```python
from core.infrastructure.Ubicaciones import Ubicaciones

grafo = Ubicaciones([producto1, producto2, ...])
distancia = grafo.distancia("SKU-001", "SKU-002")
# Retorna UnidadDistancia(metros)
```

**Métodos:**
- `distancia(origen, destino)`: Retorna UnidadDistancia (en metros)
- `nodos()`: Set de códigos de productos
- `producto(codigo)`: Producto con ese código

---

### Resultado

Resultado de ejecutar una heurística.

```python
resultado = modelo.resolver(pedidos, operarios, beta_picking=0.5)

print(resultado.tiempo_minimo)  # En minutos
print(resultado.asignacion)    # Dict {Operario: [batches]}
print(resultado.secuencia)     # Lista de pedidos
```

**Atributos:**
- `tiempo_minimo`: Tiempo total en minutos
- `asignacion`: Dict {Operario: [set[Pedido]]}
- `secuencia`: Lista de Pedido en orden de procesamiento
