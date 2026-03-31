from .Carro import Carro
from ..utils.Velocidad import Velocidad


class Operario:
    """
    Representa un operario del depósito que realiza el picking.

    Atributos:
    - codigo: identificador único del operario (ej: "OP-001")
    - nombre: nombre del operario
    - velocidad: objeto Velocidad (en metros por segundo)
    - carro: carro de picking asignado al operario
    """

    def __init__(self, codigo: str, nombre: str, velocidad: Velocidad, carro: Carro):
        self._validar_string(codigo, "código")
        self._validar_string(nombre, "nombre")
        if not isinstance(velocidad, Velocidad):
            raise ValueError(f"Se esperaba un Velocidad, se recibió: {type(velocidad)}")
        if not isinstance(carro, Carro):
            raise ValueError(f"Se esperaba un Carro, se recibió: {type(carro)}")

        self._codigo = codigo.strip()
        self._nombre = nombre.strip()
        self._velocidad = velocidad
        self._carro = carro
        self._tiempo_acumulado: float = 0.0

    def _validar_string(self, valor: str, campo: str) -> None:
        if not isinstance(valor, str) or not valor.strip():
            raise ValueError(f"El {campo} debe ser un string no vacío, se recibió: '{valor}'")

    @property
    def codigo(self) -> str:
        return self._codigo

    @property
    def nombre(self) -> str:
        return self._nombre

    @property
    def velocidad(self) -> Velocidad:
        return self._velocidad

    @property
    def carro(self) -> Carro:
        return self._carro

    @property
    def tiempo_acumulado(self) -> float:
        return self._tiempo_acumulado

    def agregar_tiempo(self, tiempo: float) -> None:
        if not isinstance(tiempo, (int, float)) or tiempo < 0:
            raise ValueError(f"El tiempo debe ser un número no negativo, se recibió: {tiempo}")
        self._tiempo_acumulado += tiempo

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Operario):
            return False
        return self._codigo == other._codigo

    def __hash__(self) -> int:
        return hash(self._codigo)

    def __repr__(self) -> str:
        return (
            f"Operario(codigo='{self._codigo}', nombre='{self._nombre}', "
            f"velocidad={self._velocidad.m_por_segundo}m/s, "
            f"tiempo_acumulado={self._tiempo_acumulado}min)"
        )