import { Flex, IconButton, Input } from "@chakra-ui/react";
import { FiMinus, FiPlus } from "react-icons/fi";
import { validateQuantity } from "@/app/utils/number-helpers";

interface ProductQuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  max?: number;
  min?: number;
}

export const ProductQuantitySelector = ({
  quantity,
  onQuantityChange,
  max = 99,
  min = 1,
}: ProductQuantitySelectorProps) => {
  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10);
    if (validateQuantity(value, min, max)) {
      onQuantityChange(value);
    }
  };

  return (
    <Flex align="center" gap="2">
      <IconButton
        aria-label="Diminuir quantidade"
        size="sm"
        variant="outline"
        onClick={handleDecrement}
        disabled={quantity <= min}
      >
        <FiMinus />
      </IconButton>

      <Input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        textAlign="center"
        w="60px"
        size="sm"
        min={min}
        max={max}
      />

      <IconButton
        aria-label="Aumentar quantidade"
        size="sm"
        variant="outline"
        onClick={handleIncrement}
        disabled={quantity >= max}
      >
        <FiPlus />
      </IconButton>
    </Flex>
  );
};
