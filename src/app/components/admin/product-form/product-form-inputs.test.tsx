// @vitest-environment jsdom
/**
 * Bateria de testes de digitação real (DOM + react-hook-form + zodResolver)
 * nos campos Título, Descrição e Preço do formulário de produto.
 *
 * Objetivo: reproduzir, com controle fino sobre o que é digitado (userEvent),
 * o comportamento relatado pelo usuário ("erro de invalidade ao digitar"),
 * usando os componentes reais (ProductBasicDataCard / ProductPriceStockCard)
 * e o schema real (productFormSchema), não um mock.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Provider } from "@/app/components/ui";
import {
  type ProductFormValues,
  productFormSchema,
} from "@/core/schemas/product.schema";
import { ProductBasicDataCard } from "./product-basic-data-card";
import { ProductPriceStockCard } from "./product-price-stock-card";

function createFormDefaults(): ProductFormValues {
  return {
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    price: 0,
    stock: 0,
    category: "",
    shopCategory: "roupas",
    sizes: [],
    isActive: true,
    status: "ACTIVE",
    colorsText: "",
  };
}

/** Harness mínimo: mesma configuração de useForm do product-form.tsx real. */
function TestHarness({
  onValidSubmit,
}: {
  onValidSubmit: (v: ProductFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProductFormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: mesma decisão do componente real
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: createFormDefaults(),
  });

  return (
    <Provider>
      <form noValidate onSubmit={handleSubmit(onValidSubmit)}>
        <ProductBasicDataCard
          register={register}
          errors={errors}
          descriptionValue={watch("description")}
          sections={[]}
          shopCategoryValue={watch("shopCategory")}
          onShopCategoryChange={(value) => setValue("shopCategory", value)}
          categories={[]}
          categoryValue={watch("category")}
          onCategoryChange={(value) => setValue("category", value)}
        />
        <ProductPriceStockCard register={register} errors={errors} />
        <button type="submit">Salvar</button>
      </form>
    </Provider>
  );
}

async function setup() {
  const user = userEvent.setup();
  const onValidSubmit = vi.fn();
  render(<TestHarness onValidSubmit={onValidSubmit} />);
  return { user, onValidSubmit };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProductForm — digitação real em Título", () => {
  it("não mostra erro algum antes de qualquer submissão, mesmo digitando incompleto", async () => {
    const { user } = await setup();
    const title = screen.getByLabelText(/^Título/i);
    await user.type(title, "Ca");
    expect(
      screen.queryByText(/Título deve ter no mínimo/i),
    ).not.toBeInTheDocument();
  });

  it("após 1 submissão inválida, erro de mínimo aparece enquanto digita e SOME ao completar 3+ chars", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() =>
      expect(
        screen.getByText(/Título é obrigatório|Título deve ter no mínimo/i),
      ).toBeInTheDocument(),
    );

    const title = screen.getByLabelText(/^Título/i);
    await user.type(title, "Ca");
    await waitFor(() =>
      expect(
        screen.getByText(/Título deve ter no mínimo 3 caracteres/i),
      ).toBeInTheDocument(),
    );

    await user.type(title, "miseta Basica Premium");
    await waitFor(() =>
      expect(
        screen.queryByText(/Título deve ter no mínimo/i),
      ).not.toBeInTheDocument(),
    );
    expect((title as HTMLInputElement).value).toBe("Camiseta Basica Premium");
  });
});

describe("ProductForm — digitação real em Descrição", () => {
  it("erro de mínimo desaparece assim que a descrição atinge 10 caracteres", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    const description = screen.getByLabelText(/^Descrição/i);
    await user.type(description, "Uma camiseta muito confortavel e bonita");

    await waitFor(() =>
      expect(
        screen.queryByText(/Descrição deve ter no mínimo/i),
      ).not.toBeInTheDocument(),
    );
    expect((description as HTMLTextAreaElement).value).toBe(
      "Uma camiseta muito confortavel e bonita",
    );
  });
});

describe("ProductForm — digitação real em Preço (input type=number)", () => {
  it("digitar '49.90' resulta no valor numérico correto e sem erro", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    const price = screen.getByLabelText(/^Preço/i);
    await user.clear(price);
    await user.type(price, "49.90");

    await waitFor(() =>
      expect(
        screen.queryByText(/Preço deve|Preço é obrigatório/i),
      ).not.toBeInTheDocument(),
    );
    expect((price as HTMLInputElement).valueAsNumber).toBeCloseTo(49.9);
  });

  it("preço com vírgula (padrão BR) é rejeitado pelo <input type=number> — dígito é descartado silenciosamente", async () => {
    const { user } = await setup();
    const price = screen.getByLabelText(/^Preço/i);
    await user.clear(price);
    await user.type(price, "49,90");
    // input type=number não aceita vírgula: o caractere é descartado pelo próprio DOM
    expect((price as HTMLInputElement).value).not.toContain(",");
  });

  it("preço 0 (valor default) dispara erro 'maior que zero' só após submit", async () => {
    const { user } = await setup();
    expect(
      screen.queryByText(/Preço deve ser maior que zero/i),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() =>
      expect(
        screen.getByText(/Preço deve ser maior que zero/i),
      ).toBeInTheDocument(),
    );
  });
});

describe("ProductForm — submissão completa (regressão do bug category/sizes)", () => {
  it("preenchendo apenas título, descrição e preço válidos (categoria/sizes ficam vazios, são opcionais) o submit passa", async () => {
    const { user, onValidSubmit } = await setup();

    await user.type(
      screen.getByLabelText(/^Título/i),
      "Camiseta Basica Premium",
    );
    await user.type(
      screen.getByLabelText(/^URL personalizada/i),
      "camiseta-basica-premium",
    );
    await user.type(
      screen.getByLabelText(/^Descrição/i),
      "Uma camiseta muito confortavel e bonita para o dia a dia",
    );
    const price = screen.getByLabelText(/^Preço/i);
    await user.clear(price);
    await user.type(price, "49.90");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onValidSubmit).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText(/Categoria deve ter no mínimo|pelo menos um tamanho/i),
    ).not.toBeInTheDocument();
  });
});
