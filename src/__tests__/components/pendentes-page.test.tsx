/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EnrichmentForm } from "@/app/(admin)/admin-produtos/pendentes/[id]/enrichment-form";
import PendentesPage from "@/app/(admin)/admin-produtos/pendentes/page";
import { Provider } from "@/app/components/ui/provider";

jest.mock("@/app/services/require-admin-session", () => ({
  requireAdminSession: jest.fn().mockResolvedValue({ uid: "123" }),
}));

jest.mock("@/infrastructure/lib/firebase-admin", () => {
  return {
    getAdminDb: jest.fn(() => ({
      collection: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            docs: [],
          }),
        }),
      }),
    })),
  };
});

jest.mock("@/app/actions/publish-product.action", () => ({
  publishProductAction: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock matchMedia for Chakra UI
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("Pending Products Page", () => {
  it("should display 'Sem produtos pendentes' when the list is empty", async () => {
    const Component = await PendentesPage();
    render(<Provider>{Component}</Provider>);

    expect(screen.getByTestId("empty-state")).toHaveTextContent(
      "Sem produtos pendentes",
    );
  });
});

describe("Enrichment Form", () => {
  it("should not submit with a negative price", async () => {
    render(
      <Provider>
        <EnrichmentForm barcode="123" />
      </Provider>,
    );

    const titleInput = screen.getByTestId("input-title");
    const priceInput = screen.getByTestId("input-price");
    const submitBtn = screen.getByTestId("submit-btn");

    fireEvent.change(titleInput, { target: { value: "Test Product" } });
    fireEvent.change(priceInput, { target: { value: "-10" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Preço inválido",
      );
    });
  });
});
