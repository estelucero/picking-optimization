import math

points = {
    'D': (0, 0),
    'A': (2, 3),
    'B': (5, 2),
    'C': (6, 6),
    'E': (8, 3),
    'F': (1, 7),
    'G': (3, 8)
}


def distance(a, b):
    x1, y1 = points[a]
    x2, y2 = points[b]
    return math.hypot(x1 - x2, y1 - y2)


def route_cost(route):
    if not route:
        return 0

    cost = distance('D', route[0])
    for i in range(len(route) - 1):
        cost += distance(route[i], route[i + 1])
    cost += distance(route[-1], 'D')

    return cost


def insertion_cost(route, node):
    if not route:
        return 2 * distance('D', node)

    best_increase = float('inf')

    for i in range(len(route) + 1):
        new_route = route[:i] + [node] + route[i:]
        increase = route_cost(new_route) - route_cost(route)
        best_increase = min(best_increase, increase)

    return best_increase


def assign_products(nodes, k, alpha=0.5):
    pickers = [[] for _ in range(k)]

    for node in nodes:
        best_picker = None
        best_score = float('inf')

        for i in range(k):
            inc = insertion_cost(pickers[i], node)
            current_cost = route_cost(pickers[i])

            # 🔥 balanceo
            score = inc + alpha * current_cost

            if score < best_score:
                best_score = score
                best_picker = i

        pickers[best_picker].append(node)

    return pickers


# -------- ejecución --------
nodes = ['A', 'B', 'C', 'E', 'F', 'G']
k = 2

assignments = assign_products(nodes, k, alpha=0.7)

for i, route in enumerate(assignments):
    print(f"Picker {i + 1}: {route}, costo = {route_cost(route):.2f}")

print("Makespan:", max(route_cost(r) for r in assignments))