# 📊 Diagrama da Arquitetura - Aurora E-commerce

## 🏗️ Estrutura Completa do Projeto

```
aurora-ecom/
│
├── 📄 ARCHITECTURE.md              # Guia completo de arquitetura
├── 📄 BACKEND-QUICKSTART.md        # Início rápido para backend
├── 📄 EXAMPLES.md                  # Exemplos práticos de uso
├── 📄 PROJECT-STRUCTURE.md         # Este arquivo
│
├── src/
│   │
│   ├── 🧠 core/                    # CAMADA DE DOMÍNIO (Regras de Negócio)
│   │   │                           # ⚡ Independente de frameworks
│   │   │
│   │   ├── schemas/                # 📝 Validações Zod (FONTE DA VERDADE)
│   │   │   └── product.schema.ts   # Schema de produto + types gerados
│   │   │                           # - Validações estritas
│   │   │                           # - TypeScript types automáticos
│   │   │                           # - Reutilizável em cliente e servidor
│   │   │
│   │   ├── entities/               # 🎯 Entidades de Domínio
│   │   │   └── product.entity.ts   # Produto com comportamentos
│   │   │                           # - Métodos de negócio (calcularDesconto, etc)
│   │   │                           # - Encapsulamento de lógica
│   │   │
│   │   ├── use-cases/              # 💼 Casos de Uso (Lógica de Negócio)
│   │   │   ├── list-products.use-case.ts
│   │   │   ├── get-product-by-id.use-case.ts
│   │   │   ├── create-product.use-case.ts
│   │   │   └── update-product.use-case.ts
│   │   │                           # - Uma classe = uma operação
│   │   │                           # - Validação + lógica + persistência
│   │   │                           # - Testável isoladamente
│   │   │
│   │   └── repositories/           # 📋 Interfaces (Contratos)
│   │       └── product.repository.interface.ts
│   │                               # - Define O QUE fazer
│   │                               # - Não define COMO fazer
│   │
│   ├── 🔧 infrastructure/          # CAMADA DE INFRAESTRUTURA
│   │   │                           # Implementações concretas
│   │   │
│   │   └── repositories/           # 💾 Persistência de Dados
│   │       └── in-memory-product.repository.ts
│   │                               # Atualmente: Array em memória
│   │                               # Futuro: PrismaProductRepository
│   │                               # - Fácil trocar implementação
│   │                               # - Não afeta core
│   │
│   ├── 🛠️ shared/                  # CÓDIGO COMPARTILHADO
│   │   │
│   │   ├── errors/                 # ❌ Erros Customizados
│   │   │   └── domain-errors.ts    # ValidationError, NotFoundError, etc
│   │   │
│   │   └── types/                  # 📦 Types Globais
│   │       └── (futuros types compartilhados)
│   │
│   └── 🎨 app/                     # CAMADA DE APRESENTAÇÃO (Next.js)
│       │                           # Interface com o usuário
│       │
│       ├── actions/                # 🚀 SERVER ACTIONS (Backend Público)
│       │   └── products.ts         # Funções "use server"
│       │                           # - Chamadas diretamente do cliente
│       │                           # - Type-safe end-to-end
│       │                           # - Sem API Routes necessários
│       │
│       ├── components/             # 🧩 Client Components
│       │   ├── product-card.tsx
│       │   ├── product-grid.tsx
│       │   └── ...
│       │
│       ├── hooks/                  # 🪝 React Hooks Customizados
│       │   ├── use-products.ts     # Hook para carregar produtos
│       │   └── ...
│       │
│       ├── (admin)/                # 🔐 Rotas Administrativas
│       │   ├── dashboard/
│       │   └── test-backend/       # 🧪 Página de testes
│       │       └── page.tsx
│       │
│       ├── (public)/               # 🌐 Rotas Públicas
│       │   ├── produto/[id]/
│       │   │   └── page.tsx        # Detalhe do produto
│       │   ├── login/
│       │   ├── sobre/
│       │   └── not-found/
│       │
│       └── page.tsx                # 🏠 Homepage (lista produtos)
│
└── package.json                    # Dependências (Next.js, Zod, etc)
```

---

## 🔄 Fluxo de Dados Completo

### Exemplo: Criar Produto

```
┌─────────────────────────────────────────────────────────────┐
│                    1. FRONTEND (Browser)                    │
│                                                             │
│  Usuario preenche formulário → Click "Criar"               │
│                                                             │
│  const result = await createProductAction(formData);       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP POST automatico
                       │ (Next.js gerencia)
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              2. SERVER ACTION (Backend - Node.js)           │
│              src/app/actions/products.ts                    │
│                                                             │
│  export async function createProductAction(input) {        │
│    const useCase = new CreateProductUseCase(repository);   │
│    return await useCase.execute(input);                    │
│  }                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Passa dados
                       ↓
┌─────────────────────────────────────────────────────────────┐
│           3. USE CASE (Lógica de Negócio)                   │
│           src/core/use-cases/create-product.use-case.ts     │
│                                                             │
│  async execute(input: CreateProductInput) {                │
│    // ✅ VALIDA com Zod                                     │
│    const validated = createProductSchema.parse(input);     │
│                                                             │
│    // ✅ LÓGICA DE NEGÓCIO (se houver)                      │
│    if (validated.price > 10000) {                          │
│      sendToApproval(validated);                            │
│    }                                                        │
│                                                             │
│    // ✅ PERSISTE                                           │
│    return this.repository.create(validated);               │
│  }                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Valida com schema
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              4. ZOD SCHEMA (Validação)                      │
│              src/core/schemas/product.schema.ts             │
│                                                             │
│  export const createProductSchema = z.object({             │
│    title: z.string().min(3).max(100),                      │
│    price: z.number().positive(),                           │
│    imageUrl: z.string().url(),                             │
│    // ... mais validações                                  │
│  });                                                        │
│                                                             │
│  ✅ Valida todos os campos                                  │
│  ✅ Se inválido → lança ZodError                            │
│  ✅ Se válido → continua                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Dados validados
                       ↓
┌─────────────────────────────────────────────────────────────┐
│            5. REPOSITORY (Persistência)                     │
│            src/infrastructure/repositories/...              │
│                                                             │
│  async create(product: Omit<Product, "id">) {              │
│    const newProduct = {                                    │
│      ...product,                                           │
│      id: randomUUID(),                                     │
│      createdAt: new Date(),                                │
│    };                                                       │
│                                                             │
│    this.products.push(newProduct); // Salva em memória     │
│    return newProduct;                                      │
│  }                                                          │
│                                                             │
│  🔄 Futuro: Trocar por PrismaRepository                     │
│     → this.prisma.product.create(...)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Produto criado
                       ↓
                  ⬆️ Retorna ⬆️
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                 6. RESPOSTA AO CLIENTE                      │
│                                                             │
│  if (result.success) {                                     │
│    console.log("Produto criado:", result.data);            │
│    // result.data = {                                      │
│    //   id: "uuid-gerado",                                 │
│    //   title: "Camiseta Nova",                            │
│    //   price: 99.90,                                      │
│    //   ...                                                │
│    // }                                                    │
│  }                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Princípios Seguidos

### 1. **Separation of Concerns** (Separação de Responsabilidades)
- **Core**: Regras de negócio puras
- **Infrastructure**: Detalhes técnicos (DB, APIs)
- **App**: Interface do usuário

### 2. **Dependency Inversion** (Inversão de Dependência)
- Use Cases dependem de **interfaces**
- Não dependem de implementações concretas
- Fácil trocar implementação sem afetar negócio

### 3. **Single Responsibility** (Responsabilidade Única)
- Um Use Case = Uma operação
- Um Schema = Uma entidade
- Um Repository = Um tipo de dado

### 4. **DRY** (Don't Repeat Yourself)
- Schema Zod é a ÚNICA fonte de validação
- Types TypeScript gerados automaticamente
- Lógica de negócio centralizada em Use Cases

---

## 📦 Fluxo de Adição de Nova Feature

### Exemplo: Adicionar "Categorias"

```
1. 📝 DEFINIR SCHEMA
   src/core/schemas/category.schema.ts
   ↓
   export const categorySchema = z.object({
     name: z.string().min(2),
     slug: z.string().regex(/^[a-z0-9-]+$/),
   });

2. 🎯 CRIAR ENTITY (opcional)
   src/core/entities/category.entity.ts
   ↓
   export class CategoryEntity {
     generateSlug() { ... }
   }

3. 📋 CRIAR INTERFACE REPOSITORY
   src/core/repositories/category.repository.interface.ts
   ↓
   export interface ICategoryRepository {
     findAll(): Promise<Category[]>;
     create(category: CreateCategoryInput): Promise<Category>;
   }

4. 💼 CRIAR USE CASES
   src/core/use-cases/create-category.use-case.ts
   ↓
   export class CreateCategoryUseCase {
     execute(input) { ... }
   }

5. 💾 IMPLEMENTAR REPOSITORY
   src/infrastructure/repositories/in-memory-category.repository.ts
   ↓
   export class InMemoryCategoryRepository implements ICategoryRepository {
     create(category) { ... }
   }

6. 🚀 CRIAR SERVER ACTION
   src/app/actions/categories.ts
   ↓
   "use server"
   export async function createCategoryAction(input) {
     const useCase = new CreateCategoryUseCase(repository);
     return useCase.execute(input);
   }

7. 🎨 USAR NO FRONTEND
   src/app/admin/categories/page.tsx
   ↓
   const result = await createCategoryAction({ name: "Camisetas" });
```

---

## 🧪 Como Testar Cada Camada

### 1. **Schemas (Zod)**
```typescript
import { productSchema } from "@/core/schemas/product.schema";

test("deve validar produto válido", () => {
  const result = productSchema.safeParse({
    title: "Camiseta",
    price: 99.90,
    // ...
  });
  
  expect(result.success).toBe(true);
});

test("deve falhar com título curto", () => {
  const result = productSchema.safeParse({
    title: "AB", // Muito curto
    // ...
  });
  
  expect(result.success).toBe(false);
});
```

### 2. **Use Cases**
```typescript
import { CreateProductUseCase } from "@/core/use-cases/create-product.use-case";

test("deve criar produto com dados válidos", async () => {
  const mockRepository = {
    create: jest.fn().mockResolvedValue({ id: "123", ... }),
  };
  
  const useCase = new CreateProductUseCase(mockRepository);
  const result = await useCase.execute({
    title: "Camiseta",
    // ...
  });
  
  expect(mockRepository.create).toHaveBeenCalled();
  expect(result.id).toBe("123");
});
```

### 3. **Repositories**
```typescript
import { InMemoryProductRepository } from "@/infrastructure/repositories/...";

test("deve criar produto em memória", async () => {
  const repository = new InMemoryProductRepository();
  
  const product = await repository.create({
    title: "Camiseta",
    // ...
  });
  
  expect(product.id).toBeDefined();
  
  const found = await repository.findById(product.id);
  expect(found?.title).toBe("Camiseta");
});
```

### 4. **Server Actions (E2E)**
```typescript
import { createProductAction } from "@/app/actions/products";

test("deve criar produto via Server Action", async () => {
  const result = await createProductAction({
    title: "Camiseta",
    // ...
  });
  
  expect(result.success).toBe(true);
  expect(result.data.title).toBe("Camiseta");
});
```

---

## 🚀 Próximos Passos

### 1. **Adicionar Prisma** (Banco Real)
```bash
npm install prisma @prisma/client
npx prisma init
```

Criar `PrismaProductRepository` que implementa `IProductRepository`.

### 2. **Autenticação com NextAuth**
```bash
npm install next-auth
```

Proteger Server Actions e rotas admin.

### 3. **Testes Automatizados**
```bash
npm install vitest @testing-library/react
```

Testar cada camada isoladamente.

### 4. **Deploy**
```bash
npm run build
```

Deploy no Vercel com zero config.

---

## 📚 Recursos de Aprendizado

- **Next.js Server Actions**: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
- **Zod Documentation**: https://zod.dev
- **Clean Architecture**: Robert C. Martin (Uncle Bob)
- **Repository Pattern**: Martin Fowler

---

## 🤝 Contribuindo

Para adicionar novas features:
1. Siga o fluxo de criação (Schema → Entity → Use Case → Repository → Action → Frontend)
2. Mantenha a separação de camadas
3. Sempre valide com Zod
4. Escreva testes para Use Cases

---

**Estrutura criada com ❤️ para Aurora E-commerce**
