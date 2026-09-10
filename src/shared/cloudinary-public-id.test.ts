import { describe, expect, it } from "vitest";
import { extractCloudinaryPublicId } from "./cloudinary-public-id";

describe("extractCloudinaryPublicId", () => {
  it("extrai o public_id de uma URL com segmento de versão", () => {
    expect(
      extractCloudinaryPublicId(
        "https://res.cloudinary.com/demo/image/upload/v1699999999/products/images/abc123.jpg",
      ),
    ).toBe("products/images/abc123");
  });

  it("extrai o public_id de uma URL sem segmento de versão", () => {
    expect(
      extractCloudinaryPublicId(
        "https://res.cloudinary.com/demo/image/upload/products/images/abc123.png",
      ),
    ).toBe("products/images/abc123");
  });

  it("descarta uma string de transformação antes do public_id", () => {
    expect(
      extractCloudinaryPublicId(
        "https://res.cloudinary.com/demo/image/upload/c_fill,w_200/v1699999999/products/images/abc123.jpg",
      ),
    ).toBe("products/images/abc123");
  });

  it("retorna null para URLs que não são do Cloudinary", () => {
    expect(
      extractCloudinaryPublicId("/images/product-placeholder.png"),
    ).toBeNull();
    expect(extractCloudinaryPublicId("https://example.com/foo.jpg")).toBeNull();
  });
});
