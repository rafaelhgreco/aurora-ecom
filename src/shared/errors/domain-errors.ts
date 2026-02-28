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
  constructor(entity: string, id: string) {
    super(`${entity} com ID ${id} não encontrado`);
    this.name = "NotFoundError";
  }
}

export class InsufficientStockError extends DomainError {
  constructor(
    public readonly available: number,
    public readonly requested: number,
  ) {
    super(
      `Estoque insuficiente. Disponível: ${available}, Solicitado: ${requested}`,
    );
    this.name = "InsufficientStockError";
  }
}
