export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
};

export const calculateInstallment = (
  price: number,
  installments: number,
): string => {
  const installmentValue = price / installments;
  return formatPrice(installmentValue);
};
