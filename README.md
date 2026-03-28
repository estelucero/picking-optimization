# 📦 Order Picking Optimizer

Sistema de simulación y optimización del proceso de **armado de pedidos** en centros de distribución. Permite modelar, experimentar y comparar distintas configuraciones operativas para reducir tiempos de recorrido y mejorar la eficiencia del picking.

---

## 🎯 ¿De qué trata el proyecto?

El objetivo es proveer una herramienta que permita:

- **Modelar** la distribución física de un depósito (layout, pasillos, estanterías, posiciones de productos).
- **Simular** la llegada de pedidos utilizando modelos probabilísticos.
- **Optimizar** la agrupación de pedidos en batches y la asignación de operarios.
- **Registrar** los resultados de cada experimento para análisis posterior.
- **Comparar** distintas configuraciones mediante visualizaciones estadísticas.

La herramienta está orientada a equipos de operaciones y logística que buscan tomar decisiones basadas en datos antes de implementar cambios reales en sus procesos.

---

## ✨ Funcionalidades principales

### 🗺️ Configuración del depósito

Definición interactiva del layout: pasillos, estanterías y posiciones de productos con coordenadas espaciales para el cálculo de distancias.

### 📊 Simulación de pedidos

Generación aleatoria de pedidos mediante modelos estocásticos. El usuario configura la tasa de llegada y la cantidad de corridas por experimento.

### 📦 Agrupación de pedidos (Batching)

Algoritmo de agrupación que minimiza la distancia total recorrida, considerando la proximidad de las ubicaciones de los productos dentro del depósito.

### 👷 Asignación de operarios

Distribución de batches entre múltiples operarios con parámetros configurables de velocidad y disponibilidad.

### 🗄️ Persistencia de experimentos

Registro completo de cada experimento: parámetros utilizados, resultados por corrida y estadísticas agregadas (media, desvío estándar, percentiles). Permite recuperar y comparar experimentos anteriores.

### 📈 Visualización y comparación

Gráficos comparativos entre experimentos: histogramas, box plots, y curvas de tiempo en función de la cantidad de operarios asignados.

---

## ⚙️ Parámetros configurables

| Parámetro                  | Descripción                                    |
| -------------------------- | ---------------------------------------------- |
| Layout del depósito        | Distribución física de productos en el espacio |
| Tasa de llegada de pedidos | Parámetro de la distribución de demanda        |
| Cantidad de simulaciones   | Número de corridas por experimento             |
| Tamaño máximo de batch     | Pedidos máximos por grupo de picking           |
| Cantidad de operarios      | Personas disponibles para el armado            |
| Velocidad del operario     | Metros por minuto de desplazamiento            |

---

## 📤 Outputs del sistema

- Tiempo promedio de armado por batch
- Tiempo total del proceso según cantidad de operarios
- Estadísticas por experimento (media, desvío estándar, percentiles)
- Comparativas visuales entre configuraciones

---
