export const validateQuantity = (
  value: number,
  min: number,
  max: number,
): boolean => {
  return !Number.isNaN(value) && value >= min && value <= max;
};

export const clampNumber = (
  value: number,
  min: number,
  max: number,
): number => {
  return Math.min(Math.max(value, min), max);
};
