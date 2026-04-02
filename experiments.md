# Experimentos de Heurística - Resultados

Fecha: 2026-04-02

## Resumen de Resultados

| Caso | Tiempo Mínimo (min) | Tiempo Ejecución (ms) | Pedidos | Operarios | Batches |
|------|---------------------|----------------------|---------|-----------|---------|
| basico | 5.40 | 0.47 | 4 | 2 | 2 |
| muchos_pedidos | 37.83 | 3.69 | 20 | 3 | 13 |
| productos_pesados | 7.60 | 0.32 | 6 | 2 | 4 |
| operarios_diferentes | 26.60 | 2.03 | 15 | 4 | 10 |
| distribucion_alejada | 63.37 | 0.50 | 7 | 2 | 2 |

## Análisis por Caso

### 1. basico
- Escenario: 4 pedidos simples, 2 operarios con velocidad idéntica
- Resultado óptimo con solo 2 batches totales
- Tiempo de ejecución muy bajo (0.47 ms)

### 2. muchos_pedidos
- 20 pedidos distribuidos en grid de 30 productos
- Mayor tiempo total (37.83 min) por cantidad de pedidos
- 13 batches indica que los pedidos no se agruparon eficientemente

### 3. productos_pesados
- Productos electrodomésticos (heladeras, lavarropas)
- Capacidad del carro aumentada a 200kg
- Tiempo bajo a pesar de productos pesados

### 4. operarios_diferentes
- 4 operarios con velocidades distintas (0.8 a 1.5 m/s)
- La heurística distribuye la carga considerando velocidad

### 5. distribucion_alejada
- Productos ubicados en extremos del almacén (coordenadas hasta 100x100)
- Mayor tiempo mínimo (63.37 min) por distancia entre productos
- Solo 2 batches indica buena agrupación por proximidad

## Conclusiones

- El tiempo de ejecución de la heurística es mínimo (< 5ms) para todos los casos
- La distancia entre productos impacta significativamente en el tiempo total
- La cantidad de batches depende de la compatibilidad de pedidos y capacidad del carro
