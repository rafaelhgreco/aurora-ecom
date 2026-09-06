import { revalidatePath } from "next/cache";
import { publishProductAction } from "@/app/actions/publish-product.action";
import { requireAdminSession } from "@/app/services/require-admin-session";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";

// Mock dependencies
jest.mock("@/app/services/require-admin-session", () => ({
  requireAdminSession: jest.fn(),
}));

jest.mock("@/infrastructure/lib/firebase-admin", () => ({
  getAdminDb: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("publishProductAction", () => {
  let mockDocGet: jest.Mock;
  let mockDocUpdate: jest.Mock;
  let mockDoc: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    (requireAdminSession as jest.Mock).mockResolvedValue({ uid: "admin123" });

    mockDocGet = jest.fn();
    mockDocUpdate = jest.fn();

    mockDoc = jest.fn(() => ({
      get: mockDocGet,
      update: mockDocUpdate,
    }));

    (getAdminDb as jest.Mock).mockReturnValue({
      collection: jest.fn(() => ({
        doc: mockDoc,
      })),
    });
  });

  it("should update fields and change status to ACTIVE", async () => {
    mockDocGet.mockResolvedValue({ exists: true });

    const result = await publishProductAction({
      barcode: "789102030",
      title: "Teclado Mecânico",
      price: 250.0,
    });

    expect(mockDocUpdate).toHaveBeenCalledWith({
      title: "Teclado Mecânico",
      price: 250.0,
      status: "ACTIVE",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin-produtos/pendentes");
    expect(result).toEqual({ success: true, data: undefined });
  });

  it("should return an error if the database update fails", async () => {
    mockDocGet.mockResolvedValue({ exists: true });
    mockDocUpdate.mockRejectedValue(new Error("Network disconnect"));

    const result = await publishProductAction({
      barcode: "789102030",
      title: "Teclado Mecânico",
      price: 250.0,
    });

    expect(result).toEqual({
      success: false,
      error: "Erro ao comunicar com o banco de dados",
    });
  });

  it("should return an error if the price is negative", async () => {
    const result = await publishProductAction({
      barcode: "789102030",
      title: "Teclado Mecânico",
      price: -10,
    });

    expect(result).toEqual({ success: false, error: "Preço inválido" });
    expect(mockDocUpdate).not.toHaveBeenCalled();
  });
});
