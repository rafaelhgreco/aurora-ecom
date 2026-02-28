# 🏗️ Guia de Arquitetura - Backend Next.js

## 📚 Índice
1. [Visão Geral da Arquitetura](#visão-geral)
2. [Camadas da Aplicação](#camadas)
3. [Fluxo de Desenvolvimento](#fluxo)
4. [Boas Práticas](#boas-práticas)
5. [Como Testar](#como-testar)

---

## 🎯 Visão Geral da Arquitetura

Este projeto segue os princípios de **Clean Architecture** adaptados para Next.js 14+, utilizando:

- ✅ **Server Actions** ao invés de API Routes
- ✅ **Zod** para validação de dados
- ✅ **Repository Pattern** para abstração de dados
- ✅ **Use Cases** para lógica de negócio
- ✅ **Type Safety** end-to-end com TypeScript

### Por que Server Actions?

```typescript
// ❌ ANTES: API Routes (boilerplate, não type-safe)
// /app/api/products/route.ts
export async function GET() {
  const products = await getProducts();
  return Response.json(products);
}

// Client precisa fazer fetch manualmente
const response = await fetch('/api/products');
const products = await response.json(); // Sem tipos!

// ✅ AGORA: Server Actions (direto, type-safe)
"use server"
export async function listProductsAction() {
  return await getProducts();
}

// Client usa diretamente
const products = await listProductsAction(); // Totalmente tipado!
```

---

## 📁 Camadas da Aplicação

### 1. **Core** - Camada de Domínio (Regras de Negócio)

```
src/core/
├── entities/         # Entidades de domínio com comportamentos
├── schemas/          # Validações Zod (FONTE DA VERDADE)
├── use-cases/        # Casos de uso (lógica de negócio)
└── repositories/     # Interfaces (contratos)
```

**Exemplo: Product Schema (product.schema.ts)**
```typescript
export const productSchema = z.object({
  title: z.string().min(3).max(100),
  price: z.number().positive(),
  imageUrl: z.string().url(),
  // ... outras validações
});

// TypeScript types gerados automaticamente
export type Product = z.infer<typeof productSchema>;
```

**Princípio**: Esta camada NÃO conhece Next.js, banco de dados ou frameworks.

---

### 2. **Infrastructure** - Camada de Infraestrutura

```
src/infrastructure/
└── repositories/     # Implementações concretas
    ├── in-memory-product.repository.ts  # Para dev/testes
    └── prisma-product.repository.ts     # Para produção (futuro)
```

**Exemplo: Repository**
```typescript
export class InMemoryProductRepository implements IProductRepository {
  async findAll(filter?: ProductFilter): Promise<Product[]> {
    // Implementação usando array em memória
  }
  
  async create(product: CreateProductInput): Promise<Product> {
    // Implementação
  }
}
```

**Princípio**: Você pode trocar a implementação (memória → Prisma → MongoDB) sem mudar o core.

---

### 3. **App** - Camada de Apresentação (Next.js)

```
src/app/
├── actions/          # Server Actions (Backend público)
├── components/       # Client Components
└── (routes)/         # Páginas Next.js
```

**Exemplo: Server Action**
```typescript
"use server"

export async function createProductAction(input: CreateProductInput) {
  const useCase = new CreateProductUseCase(productRepository);
  const product = await useCase.execute(input);
  return { success: true, data: product };
}
```

---

## 🔄 Fluxo de Desenvolvimento

### Fluxo Completo: Frontend → Backend → Repositório

```
┌─────────────────┐
│ Client Component│  (Frontend - Browser)
│   onClick()     │
└────────┬────────┘
         │ await createProductAction(data)
         ↓
┌─────────────────┐
│ Server Action   │  (Backend - Next.js Server)
│ "use server"    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Use Case        │  (Lógica de Negócio)
│ CreateProduct   │  ← Validação Zod aqui
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Repository      │  (Persistência)
│ create()        │
└────────┬────────┘
         │
         ↓
    💾 Database
```

### Exemplo Prático: Criar Produto

**1. Frontend (Client Component)**
```typescript
"use client";

async function handleSubmit(formData) {
  // Chama Server Action diretamente
  const result = await createProductAction(formData);
  
  if (result.success) {
    alert("Produto criado!");
  } else {
    console.error(result.error);
    console.log(result.details); // Erros de validação
  }
}
```

**2. Backend (Server Action)**
```typescript
"use server";

export async function createProductAction(input: CreateProductInput) {
  try {
    const useCase = new CreateProductUseCase(productRepository);
    const product = await useCase.execute(input);
    return { success: true, data: product };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { 
        success: false, 
        error: error.message,
        details: error.errors 
      };
    }
    throw error;
  }
}
```

**3. Use Case (Lógica de Negócio)**
```typescript
export class CreateProductUseCase {
  async execute(input: CreateProductInput): Promise<Product> {
    // Valida com Zod
    const validatedData = createProductSchema.parse(input);
    
    // Persiste
    return await this.productRepository.create(validatedData);
  }
}
```

**4. Repository (Persistência)**
```typescript
export class InMemoryProductRepository {
  async create(product: Omit<Product, "id">): Promise<Product> {
    const newProduct = { ...product, id: randomUUID() };
    this.products.push(newProduct);
    return newProduct;
  }
}
```

---

## ✅ Boas Práticas

### 1. **Schema como Fonte da Verdade**

```typescript
// ✅ BOM: Schema centralizado
export const productSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres"),
  price: z.number().positive("Preço deve ser positivo"),
});

// Deriva tipos automaticamente
export type Product = z.infer<typeof productSchema>;

// ❌ EVITE: Types duplicados
type Product = {
  title: string; // Sem validação!
  price: number;
}
```

### 2. **Use Cases para Lógica Complexa**

```typescript
// ✅ BOM: Lógica no Use Case
export class CreateProductUseCase {
  async execute(input: CreateProductInput) {
    // Validação
    const validatedData = createProductSchema.parse(input);
    
    // Regras de negócio
    if (validatedData.price > 10000) {
      // Envia para aprovação
    }
    
    // Persiste
    return this.repository.create(validatedData);
  }
}

// ❌ EVITE: Lógica na Server Action
export async function createProductAction(input) {
  if (input.price > 10000) { /* ... */ } // ❌ Lógica aqui
  return repository.create(input);
}
```

### 3. **Tratamento de Erros Consistente**

```typescript
// ✅ BOM: Retorno padronizado
export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; details?: any };

// ✅ BOM: Erros customizados
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message);
  }
}
```

### 4. **Repository Pattern para Flexibilidade**

```typescript
// Interface
export interface IProductRepository {
  findAll(): Promise<Product[]>;
  create(product: CreateProductInput): Promise<Product>;
}

// Desenvolvimento: In-Memory
export class InMemoryProductRepository implements IProductRepository { }

// Produção: Prisma
export class PrismaProductRepository implements IProductRepository { }

// Troca sem impacto no core!
const repository = process.env.NODE_ENV === 'production'
  ? new PrismaProductRepository()
  : new InMemoryProductRepository();
```

### 5. **Hooks para Reutilização**

```typescript
// ✅ BOM: Hook reutilizável
export function useProducts(filter?: ProductFilter) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProductsAction(filter).then(result => {
      if (result.success) setProducts(result.data);
    });
  }, [filter]);

  return { products, loading };
}

// Uso em qualquer componente
function MyComponent() {
  const { products, loading } = useProducts({ category: "Camisetas" });
}
```

---

## 🧪 Como Testar

### 1. **Acessar Página de Testes**

Inicie o servidor e acesse:
```bash
npm run dev
# Abra: http://localhost:3000/test-backend
```

### 2. **Testes Disponíveis**

A página `/test-backend` contém:
- ✅ Listar todos os produtos
- ✅ Buscar produto por ID (existente e inexistente)
- ✅ Criar novo produto
- ✅ Atualizar produto existente
- ✅ Testar validações (com dados inválidos)

### 3. **Teste Manual via Código**

```typescript
// Em qualquer Client Component
import { createProductAction } from "@/app/actions/products";

async function test() {
  const result = await createProductAction({
    title: "Novo Produto",
    description: "Descrição completa do produto",
    price: 99.90,
    imageUrl: "https://...",
    images: ["https://..."],
  });

  console.log(result);
  // { success: true, data: { id: "...", title: "...", ... } }
}
```

---

## 🎓 Aprendizados-Chave

### Diferença: Next.js Backend vs API REST Tradicional

| Aspecto | API REST | Server Actions |
|---------|----------|----------------|
| **Rotas** | `/api/products` | Funções diretas |
| **HTTP** | fetch, axios | Chamada de função |
| **Tipos** | Sem garantia | Type-safe nativo |
| **Boilerplate** | Muito | Mínimo |
| **Streaming** | Complexo | Built-in |

### Quando Usar Cada Abordagem

**Use Server Actions quando:**
- ✅ Aplicação full-stack Next.js
- ✅ Frontend e backend no mesmo repositório
- ✅ Precisa de type safety end-to-end
- ✅ Mutations simples (CRUD)

**Use API Routes quando:**
- ✅ API pública para terceiros
- ✅ Webhooks
- ✅ Integrações com serviços externos
- ✅ Precisa de controle fino sobre HTTP (headers, status codes)

---

## 📝 Próximos Passos

1. **Adicionar Prisma** para banco de dados real
2. **Implementar Autenticação** (NextAuth.js)
3. **Cache com React Server Components**
4. **Testes Unitários** para Use Cases
5. **Testes E2E** com Playwright

---

## 🤝 Contribuindo

Para adicionar novas features:

1. Defina o **Schema** (Zod) em `src/core/schemas/`
2. Crie a **Entity** em `src/core/entities/`
3. Crie **Use Cases** em `src/core/use-cases/`
4. Exponha via **Server Action** em `src/app/actions/`
5. Consuma no **Frontend** via hook ou diretamente

---

**Autor**: Aurora E-commerce Team  
**Versão**: 1.0.0  
**Última Atualização**: Fevereiro 2026
