import { revalidatePath } from "next/cache";
import { scanBarcodeAction } from "@/app/actions/scan-barcode.action";
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

jest.mock("firebase-admin/firestore", () => {
  const original = jest.requireActual("firebase-admin/firestore");
  return {
    ...original,
    FieldValue: {
      increment: jest.fn((val) => `increment(${val})`),
    },
    Timestamp: {
      now: jest.fn(() => "mocked-timestamp"),
    },
  };
});

describe("scanBarcodeAction", () => {
  let mockDocGet: jest.Mock;
  let mockDocSet: jest.Mock;
  let mockDocUpdate: jest.Mock;
  let mockDoc: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    (requireAdminSession as jest.Mock).mockResolvedValue({ uid: "admin123" });

    mockDocGet = jest.fn();
    mockDocSet = jest.fn();
    mockDocUpdate = jest.fn();

    mockDoc = jest.fn(() => ({
      get: mockDocGet,
      set: mockDocSet,
      update: mockDocUpdate,
    }));

    (getAdminDb as jest.Mock).mockReturnValue({
      collection: jest.fn(() => ({
        doc: mockDoc,
      })),
    });
  });

  it("should create a new DRAFT product if barcode does not exist", async () => {
    mockDocGet.mockResolvedValue({ exists: false });

    const result = await scanBarcodeAction("123456");

    expect(mockDoc).toHaveBeenCalledWith("123456");
    expect(mockDocSet).toHaveBeenCalledWith({
      barcode: "123456",
      status: "DRAFT",
      stock: 1,
      title: "Produto Pendente 123456",
      createdAt: "mocked-timestamp",
      updatedAt: "mocked-timestamp",
      isActive: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin-produtos/pendentes");
    expect(result).toEqual({ success: true, data: undefined });
  });

  it("should increment stock if product already exists", async () => {
    mockDocGet.mockResolvedValue({ exists: true });

    const result = await scanBarcodeAction("123456");

    expect(mockDoc).toHaveBeenCalledWith("123456");
    expect(mockDocUpdate).toHaveBeenCalledWith({
      stock: "increment(1)",
      updatedAt: "mocked-timestamp",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin-produtos/pendentes");
    expect(result).toEqual({ success: true, data: undefined });
  });

  it("should return an error if database communication fails", async () => {
    mockDocGet.mockRejectedValue(new Error("Network Error"));

    const result = await scanBarcodeAction("123456");

    expect(result).toEqual({
      success: false,
      error: "Erro ao comunicar com o banco de dados",
    });
  });
});
