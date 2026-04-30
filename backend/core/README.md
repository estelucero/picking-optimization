# Core - Picking Optimization

Módulo core del sistema de optimización de picking.

## Estructura

```
core/
├── infrastructure/    # Entidades del dominio
├── algoritmos/        # Algoritmos y heurísticas
├── interfaces/        # Contratos abstractos
├── utils/            # Utilidades y value objects
└── main.py           # Ejemplo de uso
```

## Unidades

Todas las magnitudes físicas están tipadas para evitar errores de unidad.

| Magnitud | Unidad | Descripción |
|----------|--------|-------------|
| Distancia | metros (m) | Coordenadas x, y de productos en el depósito |
| Velocidad | m/s | Velocidad de caminata de los operarios |
| Tiempo | minutos (min) | Resultado del algoritmo (tiempo mínimo total) |

### Conversiones internas

- `Velocidad.metros_por_minuto`: m/s × 60 = m/min
- Fórmula del algoritmo: `distancia(m) / velocidad(m/min) + beta * items`

## Módulos

- [infrastructure/](infrastructure/) - Entidades del dominio
- [algoritmos/](algoritmos/) - Algoritmos y heurísticas
- [interfaces/](interfaces/) - Contratos abstractos
- [utils/](utils/) - Value objects para unidades

## Ejecución

### Tests
```bash
pytest tests/ -v
```

### Ejemplo
```bash
python -m core.main
```
Create uvicorn Run in IDE
- new python run
- module: uvicorn
- parameters: mainApi:app --reload
- workingDir: 