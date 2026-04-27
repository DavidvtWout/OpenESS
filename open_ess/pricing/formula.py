"""Safe mathematical formula evaluation for price calculations.

Only allows basic arithmetic operations on the 'price' variable.
No function calls, attribute access, or other potentially unsafe operations.
"""

import ast
import operator
from collections.abc import Callable

# Allowed binary operators
BINARY_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
}

# Allowed unary operators
UNARY_OPS = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}


class FormulaError(Exception):
    """Raised when a formula is invalid or contains disallowed operations."""

    pass


def _eval_node(node: ast.AST, price: float) -> float:
    """Recursively evaluate an AST node with the given price value."""
    if isinstance(node, ast.Expression):
        return _eval_node(node.body, price)

    elif isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return float(node.value)
        raise FormulaError(f"Only numeric constants allowed, got {type(node.value).__name__}")

    elif isinstance(node, ast.Name):
        if node.id in ("price", "p"):
            return price
        raise FormulaError(f"Unknown variable '{node.id}', only 'price' or 'p' allowed")

    elif isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in BINARY_OPS:
            raise FormulaError(f"Operator {op_type.__name__} not allowed")
        left = _eval_node(node.left, price)
        right = _eval_node(node.right, price)
        return BINARY_OPS[op_type](left, right)

    elif isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type not in UNARY_OPS:
            raise FormulaError(f"Unary operator {op_type.__name__} not allowed")
        operand = _eval_node(node.operand, price)
        return UNARY_OPS[op_type](operand)

    else:
        raise FormulaError(f"Expression type {type(node).__name__} not allowed")


def compile_formula(formula: str) -> Callable[[float], float]:
    """Compile a formula string into a callable function.

    The formula can use 'price' or 'p' as the market price variable.
    Only basic arithmetic is allowed: +, -, *, /, **, //, %

    Examples:
        "(price + 0.01653 + 0.1088) * 1.21"
        "p * 1.21 + 0.05"
        "price"  # pass-through

    Args:
        formula: Mathematical expression string

    Returns:
        A function that takes a price (float) and returns the calculated price

    Raises:
        FormulaError: If the formula contains invalid syntax or disallowed operations
    """
    try:
        tree = ast.parse(formula, mode="eval")
    except SyntaxError as e:
        raise FormulaError(f"Invalid formula syntax: {e}") from e

    # Validate the tree before returning the evaluator
    def validate(node: ast.AST) -> None:
        if isinstance(node, ast.Expression):
            validate(node.body)
        elif isinstance(node, ast.Constant):
            if not isinstance(node.value, (int, float)):
                raise FormulaError("Only numeric constants allowed")
        elif isinstance(node, ast.Name):
            if node.id not in ("price", "p"):
                raise FormulaError(f"Unknown variable '{node.id}'")
        elif isinstance(node, ast.BinOp):
            if type(node.op) not in BINARY_OPS:
                raise FormulaError("Operator not allowed")
            validate(node.left)
            validate(node.right)
        elif isinstance(node, ast.UnaryOp):
            if type(node.op) not in UNARY_OPS:
                raise FormulaError("Unary operator not allowed")
            validate(node.operand)
        else:
            raise FormulaError(f"Expression type {type(node).__name__} not allowed")

    validate(tree)

    def evaluator(price: float) -> float:
        return _eval_node(tree, price)

    return evaluator


def evaluate_formula(formula: str, price: float) -> float:
    """Evaluate a formula with the given price value.

    Convenience function that compiles and evaluates in one step.
    For repeated evaluations, use compile_formula() instead.
    """
    return compile_formula(formula)(price)
