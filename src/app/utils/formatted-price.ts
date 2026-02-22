export const formattedPrice = (price: number | string) =>
  typeof price === "number"
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(price)
    : price;
