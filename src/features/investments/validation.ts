const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;

export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function validateSymbol(symbol: string): string | null {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return 'Stock symbol is required.';
  if (!SYMBOL_PATTERN.test(normalized)) return 'Enter a valid stock symbol (for example, AAPL).';
  return null;
}

export function validatePosition(symbol: string, quantity: string, averageCost: string) {
  const errors: { symbol?: string; quantity?: string; averageCost?: string } = {};
  const symbolError = validateSymbol(symbol);
  if (symbolError) errors.symbol = symbolError;
  const parsedQuantity = Number(quantity);
  const parsedCost = Number(averageCost);
  if (!quantity.trim() || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0)
    errors.quantity = 'Quantity must be a number greater than zero.';
  if (!averageCost.trim() || !Number.isFinite(parsedCost) || parsedCost < 0)
    errors.averageCost = 'Average cost must be zero or greater.';
  return {
    errors,
    valid: Object.keys(errors).length === 0,
    quantity: parsedQuantity,
    averageCost: parsedCost,
  };
}
