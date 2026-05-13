from datetime import datetime

import numpy as np
from pydantic import BaseModel, Field

from api.models import ExperimentoPreview
from api.routers.experimento_preview import create_experimento_preview
from api.routers.run_preview import create_run_preview
from core.algoritmos.Modelo import Modelo
from core.algoritmos.Tsp import TSP
from core.infrastructure.Carro import Carro
from core.infrastructure.Operario import Operario
from core.infrastructure.Pedido import Pedido
from core.infrastructure.Producto import Producto
from core.infrastructure.Ubicaciones import Ubicaciones
from core.utils.Velocidad import Velocidad
from api.models import PedidoModel, ProductoModel, RunPreview, Run


class ConfiguracionExperimento(BaseModel):
    media_tamano_pedido: float = Field(..., gt=0)
    media_pedidos_mes: float = Field(..., gt=0)
    max_operarios: int = Field(..., ge=1)
    iteraciones: int = Field(..., ge=1)
    beta_picking: float = Field(default=0.5, ge=0)
    deposito: str = Field(default="DEPOSITO", min_length=1)
    velocidad_operario_m_s: float = Field(default=1.0, gt=0)
    capacidad_carro: float = Field(default=30.0, gt=0)
    seed: int | None = None


class ResultadoOperario(BaseModel):
    operarios: int
    tiempo: float
    tiempo_promedio: float
    tiempo_minimo: float
    tiempo_maximo: float
    desvio_std: float
    muestras: int


class ResultadoExperimentos(BaseModel):
    resultados: list[ResultadoOperario]
    iteraciones: int
    media_pedidos_mes: float
    media_tamano_pedido: float


class Experimentos:
    def __init__(self, productos: list[Producto], configuracion: ConfiguracionExperimento):
        self._productos = productos
        self._configuracion = configuracion

        codigos = {producto.codigo for producto in productos}
        if configuracion.deposito not in codigos:
            raise ValueError("El deposito configurado no existe en productos")

        self._productos_sin_deposito = [
            producto for producto in productos if producto.codigo != configuracion.deposito
        ]
        if not self._productos_sin_deposito:
            raise ValueError("Se requiere al menos un producto distinto del deposito")

    def ejecutar(self) -> ResultadoExperimentos:
        rng = np.random.default_rng(self._configuracion.seed)

        ubicaciones = Ubicaciones(productos=self._productos)
        tsp = TSP(grafo=ubicaciones, deposito=self._configuracion.deposito)
        modelo = Modelo(tsp=tsp)

        tiempos_por_operario: dict[int, list[float]] = {
            cantidad_operarios: []
            for cantidad_operarios in range(1, self._configuracion.max_operarios + 1)
        }

        #TODO:crear experimento preview
        experiemento_preview = ExperimentoPreview(nombre="pendiente",
                           fecha=datetime.now(),
                           layout="pendiente",
                           max_operarios=self._configuracion.max_operarios,
                           runs=self._configuracion.iteraciones,
                           estado="creado")
        created_experimento_preview = create_experimento_preview(experiemento_preview)

        #Itero cantidad de runs por operario
        for indice_iteracion in range(self._configuracion.iteraciones):
            #Genero pedidos
            pedidos = self._generar_pedidos_poisson(rng, indice_iteracion)

            # pedido_model: PedidoModel
            pedido_models: list[PedidoModel] = []

            for pedido in pedidos:

                producto_models :list[ProductoModel] = []

                for producto, cantidad in pedido.items.items():

                    producto_models.append(ProductoModel(codigo=producto.codigo,
                                                         nombre=producto.nombre,
                                                         peso=producto.peso,
                                                         x=producto.x,
                                                         y=producto.y,
                                                         cantidad=cantidad)
                                           )

                pedido_model =PedidoModel(codigo=pedido.codigo,
                                              cliente=pedido.cliente,
                                              items= producto_models,
                                              operario="")
                pedido_models.append(pedido_model)


            #Itero numero de operarios
            for cantidad_operarios in range(1, self._configuracion.max_operarios + 1):
                operarios = self._crear_operarios(cantidad_operarios)
                #Resuelve el modelo
                resultado = modelo.resolver(
                    pedidos,
                    operarios,
                    beta_picking=self._configuracion.beta_picking,
                )
                tiempos_por_operario[cantidad_operarios].append(resultado.tiempo_minimo)

                #Genero Run preview y Run

                #calculo distancia total
                distancia_total = 0
                for operario, viajes in resultado.asignacion.items():
                    for viaje in viajes:
                        distancia_total =+ viaje.distancia

                run_preview = RunPreview(experimento_preview_id=created_experimento_preview["id"],
                                         nombre="Pendiente",
                                         tiempo=resultado.tiempo_minimo,
                                         distancia=distancia_total,
                                         pedidos=len(pedidos),
                                         operarios=cantidad_operarios)
                created_run_preview = create_run_preview(run_preview)

                
                run = Run(run_preview_id=created_run_preview["id"],
                          pedidos=pedido_models,
                          metricas="",
                          opearios="")


        resultados = []
        for cantidad_operarios, muestras in tiempos_por_operario.items():
            tiempo_promedio = float(np.mean(muestras))
            resultados.append(
                ResultadoOperario(
                    operarios=cantidad_operarios,
                    tiempo=round(tiempo_promedio, 3),
                    tiempo_promedio=round(tiempo_promedio, 3),
                    tiempo_minimo=round(float(np.min(muestras)), 3),
                    tiempo_maximo=round(float(np.max(muestras)), 3),
                    desvio_std=round(float(np.std(muestras)), 3),
                    muestras=len(muestras),
                )
            )

        return ResultadoExperimentos(
            resultados=resultados,
            iteraciones=self._configuracion.iteraciones,
            media_pedidos_mes=self._configuracion.media_pedidos_mes,
            media_tamano_pedido=self._configuracion.media_tamano_pedido,
        )

    def _generar_pedidos_poisson(
        self,
        rng: np.random.Generator,
        indice_iteracion: int,
    ) -> list[Pedido]:
        cantidad_pedidos = max(1, int(rng.poisson(self._configuracion.media_pedidos_mes)))
        pedidos: list[Pedido] = []

        for indice_pedido in range(cantidad_pedidos):
            tamano_pedido = max(1, int(rng.poisson(self._configuracion.media_tamano_pedido)))
            tamano_pedido = min(tamano_pedido, len(self._productos_sin_deposito))

            indices = rng.choice(
                len(self._productos_sin_deposito),
                size=tamano_pedido,
                replace=False,
            )
            indices_lista = np.atleast_1d(indices).tolist()

            productos_del_pedido = [self._productos_sin_deposito[i] for i in indices_lista]
            items = {producto: 1 for producto in productos_del_pedido}

            pedidos.append(
                Pedido(
                    codigo=f"PED-{indice_iteracion + 1:03d}-{indice_pedido + 1:04d}",
                    cliente=f"Cliente {indice_iteracion + 1}-{indice_pedido + 1}",
                    items=items,
                )
            )

        return pedidos

    def _crear_operarios(self, cantidad_operarios: int) -> list[Operario]:
        operarios = []

        for indice_operario in range(cantidad_operarios):
            operarios.append(
                Operario(
                    codigo=f"OP-{indice_operario + 1:03d}",
                    nombre=f"Operario {indice_operario + 1}",
                    velocidad=Velocidad(m_por_segundo=self._configuracion.velocidad_operario_m_s),
                    carro=Carro(capacidad_max_peso=self._configuracion.capacidad_carro),
                )
            )

        return operarios
