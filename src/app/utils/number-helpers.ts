export const validateQuantity = (
  value: number,
  min: number,
  max: number,
): boolean => {
  return !Number.isNaN(value) && value >= min && value <= max;
};
