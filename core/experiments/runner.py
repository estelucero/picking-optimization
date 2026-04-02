import csv
import time
import os
from core.experiments import TODOS_LOS_EXPERIMENTOS


def ejecutar_experimentos():
    resultados = []

    for nombre, experimento_fn in TODOS_LOS_EXPERIMENTOS:
        print(f"Ejecutando experimento: {nombre}...")
        inicio = time.time()
        resultado = experimento_fn()
        fin = time.time()
        tiempo_ejecucion_ms = (fin - inicio) * 1000

        resultado["tiempo_ejecucion_ms"] = tiempo_ejecucion_ms
        resultados.append(resultado)

        print(f"  -> Tiempo mínimo: {resultado['tiempo_minimo_min']:.2f} min")
        print(f"  -> Tiempo ejecución: {tiempo_ejecucion_ms:.2f} ms")
        print()

    return resultados


def guardar_csv(resultados: list[dict], ruta: str = "results_experiments.csv"):
    columnas = ["caso", "tiempo_minimo_min", "tiempo_ejecucion_ms", "cantidad_pedidos", "cantidad_operarios", "cantidad_batches_total"]

    with open(ruta, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columnas, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(resultados)

    print(f"Resultados guardados en: {os.path.abspath(ruta)}")


def main():
    print("=" * 60)
    print("EJECUTANDO EXPERIMENTOS DE HEURISTICA")
    print("=" * 60)
    print()

    resultados = ejecutar_experimentos()

    print("=" * 60)
    print("RESUMEN DE RESULTADOS")
    print("=" * 60)
    for r in resultados:
        print(f"{r['caso']:25s} | {r['tiempo_minimo_min']:8.2f} min | {r['tiempo_ejecucion_ms']:8.2f} ms | "
              f"pedidos={r['cantidad_pedidos']:3d} | operarios={r['cantidad_operarios']} | batches={r['cantidad_batches_total']}")

    print()
    guardar_csv(resultados)


if __name__ == "__main__":
    main()
