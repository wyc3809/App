/**
 * Lightweight amount keypad helpers for ledger quick-entry.
 * Supports digit entry and a simple trailing expression with + - × ÷.
 */

const OPS = new Set(["+", "-", "*", "/"]);

export function sanitizeAmountInput(raw: string): string {
  return raw.replace(/[^0-9.+\-*/]/g, "");
}

/** Append a digit or decimal point to the current amount expression. */
export function appendKey(expr: string, key: string): string {
  if (key === "00") {
    if (!expr || OPS.has(expr.slice(-1))) return `${expr}0`;
    if (expr === "0") return "0";
    return `${expr}00`;
  }

  if (key === ".") {
    const tail = expr.split(/[+\-*/]/).pop() ?? "";
    if (tail.includes(".")) return expr;
    if (!expr || OPS.has(expr.slice(-1))) return `${expr}0.`;
    return `${expr}.`;
  }

  if (/^\d$/.test(key)) {
    const tail = expr.split(/[+\-*/]/).pop() ?? "";
    if (tail === "0") return `${expr.slice(0, -1)}${key}`;
    return `${expr}${key}`;
  }

  return expr;
}

/** Append or replace the trailing operator. */
export function appendOperator(expr: string, op: "+" | "-" | "*" | "/"): string {
  if (!expr) return "";
  if (OPS.has(expr.slice(-1))) return `${expr.slice(0, -1)}${op}`;
  return `${expr}${op}`;
}

export function backspace(expr: string): string {
  return expr.slice(0, -1);
}

/**
 * Evaluate a left-to-right expression without operator precedence
 * (matches typical money-app keypads: 10+2*3 → 36).
 */
export function evaluateExpression(expr: string): number | null {
  const cleaned = sanitizeAmountInput(expr);
  if (!cleaned) return null;
  if (OPS.has(cleaned.slice(-1))) {
    return evaluateExpression(cleaned.slice(0, -1));
  }

  const tokens = cleaned.match(/(\d+\.?\d*|\.\d+|[+\-*/])/g);
  if (!tokens || tokens.length === 0) return null;

  let total = Number(tokens[0]);
  if (Number.isNaN(total)) return null;

  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const rhs = Number(tokens[i + 1]);
    if (!op || Number.isNaN(rhs)) return null;
    switch (op) {
      case "+":
        total += rhs;
        break;
      case "-":
        total -= rhs;
        break;
      case "*":
        total *= rhs;
        break;
      case "/":
        if (rhs === 0) return null;
        total /= rhs;
        break;
      default:
        return null;
    }
  }

  if (!Number.isFinite(total)) return null;
  return Number(total.toFixed(2));
}

/** Display string for the amount bar (keeps expression while typing). */
export function formatKeypadDisplay(
  expr: string,
  symbol: string,
): string {
  if (!expr) return `${symbol}0`;
  return `${symbol}${expr.replace(/\*/g, "×").replace(/\//g, "÷")}`;
}
