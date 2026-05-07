from .caso_1_basico import experimento as exp_basico
from .caso_2_muchos_pedidos import experimento as exp_muchos_pedidos
from .caso_3_productos_pesados import experimento as exp_productos_pesados
from .caso_4_operarios_diferentes import experimento as exp_operarios_diferentes
from .caso_5_distribucion_alejada import experimento as exp_distribucion_alejada
from .experimentos import ConfiguracionExperimento, Experimentos

TODOS_LOS_EXPERIMENTOS = [
    ("basico", exp_basico),
    ("muchos_pedidos", exp_muchos_pedidos),
    ("productos_pesados", exp_productos_pesados),
    ("operarios_diferentes", exp_operarios_diferentes),
    ("distribucion_alejada", exp_distribucion_alejada),
]

__all__ = ["TODOS_LOS_EXPERIMENTOS", "ConfiguracionExperimento", "Experimentos"]
