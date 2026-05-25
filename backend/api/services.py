from api.models import ExperimentoRunRequest
from core.experiments.experimentos import ConfiguracionExperimento, Experimentos
from core.infrastructure.Producto import Producto


class ExperimentoService:
    @staticmethod
    def ejecutar_desde_ubicacion(
        ubicacion_document: dict,
        payload: ExperimentoRunRequest,
    ) -> dict:
        productos = [
            Producto(
                codigo=producto["codigo"],
                nombre=producto["nombre"],
                peso=producto["peso"],
                x=producto["x"],
                y=producto["y"],
            )
            for producto in ubicacion_document["productos"]
        ]

        configuracion = ConfiguracionExperimento(
            media_tamano_pedido=payload.media_tamano_pedido,
            media_pedidos_mes=payload.media_pedidos_mes,
            max_operarios=payload.max_operarios,
            iteraciones=payload.iteraciones,
            beta_picking=payload.beta_picking,
            deposito=ubicacion_document.get("deposito", "DEPOSITO"),
            seed=payload.seed,
        )

        resultado = Experimentos(productos=productos, configuracion=configuracion).ejecutar()
        return resultado
