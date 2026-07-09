export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends DomainError {
  public readonly entity: string;
  public readonly id: string;

  constructor(entity: string, id: string) {
    super(`${entity} não encontrado`);
    this.name = "NotFoundError";
    this.entity = entity;
    this.id = id;
  }
}

export class InsufficientStockError extends DomainError {
  constructor(
    public readonly available: number,
    public readonly requested: number,
    public readonly productTitle?: string,
  ) {
    super(
      productTitle
        ? `Estoque insuficiente para "${productTitle}". Disponível: ${available}`
        : `Estoque insuficiente. Disponível: ${available}, Solicitado: ${requested}`,
    );
    this.name = "InsufficientStockError";
  }
}
