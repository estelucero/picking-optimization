class Producto:
    """
    Representa un producto dentro del depósito.
    Cada producto es un nodo en el grafo de ubicaciones.
 
    Atributos:
    - codigo: identificador único del producto (ej: "SKU-001")
    - nombre: nombre descriptivo del producto (ej: "Silla de oficina")
    - peso: peso en kilogramos, debe ser mayor a 0
    - x, y: coordenadas 2D de la ubicación del producto en el depósito
    """
 
    def __init__(self, codigo: str, nombre: str, peso: float, x: float, y: float):
        self._validar_string(codigo, "código")
        self._validar_string(nombre, "nombre")
        self._validar_peso(peso)
        self._validar_coordenada(x, "x")
        self._validar_coordenada(y, "y")
 
        self._codigo = codigo.strip()
        self._nombre = nombre.strip()
        self._peso = float(peso)
        self._x = float(x)
        self._y = float(y)
 
    def _validar_string(self, valor: str, campo: str) -> None:
        if not isinstance(valor, str) or not valor.strip():
            raise ValueError(f"El {campo} debe ser un string no vacío, se recibió: '{valor}'")
 
    def _validar_peso(self, peso: float) -> None:
        if not isinstance(peso, (int, float)):
            raise ValueError(f"El peso debe ser numérico, se recibió: '{peso}'")
        if peso <= 0:
            raise ValueError(f"El peso debe ser mayor a 0, se recibió: {peso}")
 
    def _validar_coordenada(self, valor: float, eje: str) -> None:
        if not isinstance(valor, (int, float)):
            raise ValueError(f"La coordenada '{eje}' debe ser numérica, se recibió: '{valor}'") 
 
    @property
    def codigo(self) -> str:
        return self._codigo
 
    @property
    def nombre(self) -> str:
        return self._nombre
 
    @property
    def peso(self) -> float:
        return self._peso
 
    @property
    def x(self) -> float:
        return self._x
 
    @property
    def y(self) -> float:
        return self._y
 
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Producto):
            return False
        return self._codigo == other._codigo
 
    def __hash__(self) -> int:
        return hash(self._codigo)
 
    def __repr__(self) -> str:
        return (
            f"Producto(codigo='{self._codigo}', nombre='{self._nombre}', "
            f"peso={self._peso}kg, x={self._x}, y={self._y})"
        )