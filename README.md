# 🚀 Aurora E-Commerce - Backend Next.js com Firebase

Backend moderno construído com **Clean Architecture**, **Next.js Server Actions** e **Firebase Storage**.

## 📋 O que foi implementado?

- ✅ **Clean Architecture** com camadas Core, Infrastructure e App
- ✅ **Server Actions** (sem API Routes!)
- ✅ **Zod** para validação end-to-end
- ✅ **Repository Pattern** com Firestore
- ✅ **Cloudinary** para upload de imagens
- ✅ **Formulário Completo** de cadastro de produtos
- ✅ **React Hook Form** + Zod resolver
- ✅ **Chakra UI v3** componentes
- ✅ **Componentes de Estado** reutilizáveis (Loading/Error/Empty)
- ✅ **WhatsApp Checkout** integração segura

---

## 🏃 Quick Start

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar Firebase
Siga o guia rápido: **[QUICK-START.md](./QUICK-START.md)** (5 minutos)

### 3. Rodar o projeto
```bash
npm run dev
```

### 4. Acessar

- **Homepage:** http://localhost:3001
- **Página de Teste:** http://localhost:3001/test-backend
- **Novo Produto:** http://localhost:3001/admin/produtos/novo
- **Teste Checkout:** http://localhost:3001/teste-checkout

---

## 📖 Documentação

### Para Começar
- **[QUICK-START.md](./QUICK-START.md)** - Setup rápido do Firebase (5 min)
- **[BACKEND-QUICKSTART.md](./BACKEND-QUICKSTART.md)** - Guia rápido da arquitetura

### Arquitetura
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura completa e padrões
- **[EXAMPLES.md](./EXAMPLES.md)** - Exemplos práticos de uso

### Features
- **[PRODUCT-FORM-GUIDE.md](./PRODUCT-FORM-GUIDE.md)** - Guia completo do formulário com upload
- **[STATE-COMPONENTS.md](./STATE-COMPONENTS.md)** - Componentes de estado reutilizáveis
- **[WHATSAPP_CHECKOUT.md](./docs/WHATSAPP_CHECKOUT.md)** - Integração com WhatsApp para checkout

---

## 🎯 Visão Geral da Arquitetura

### Clean Architecture + Server Actions

```
┌─────────────────────────────────────────────────┐
│              Frontend (RSC/Client)              │
│  ┌──────────────────────────────────────────┐  │
│  │        Server Actions (Type-Safe)        │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│              Use Cases (Business)               │
│     ┌────────────┬────────────┬─────────────┐  │
│     │   Create   │   List     │   Update    │  │
│     └────────────┴────────────┴─────────────┘  │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│         Repository (Data Abstraction)           │
│              In-Memory / Database               │
└─────────────────────────────────────────────────┘
```

### Benefícios

- ✅ **Type-Safe:** TypeScript end-to-end
- ✅ **Sem Boilerplate:** Sem API Routes
- ✅ **Validação Dupla:** Client + Server com Zod
- ✅ **Testável:** Camadas isoladas
- ✅ **Escalável:** Fácil trocar implementações

---

## 📁 Estrutura do Projeto

```
aurora-ecom/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (admin)/                # Rotas administrativas
│   │   │   ├── dashboard/
│   │   │   └── produtos/
│   │   │       └── novo/           # Formulário de novo produto
│   │   ├── (public)/               # Rotas públicas
│   │   ├── actions/                # Server Actions
│   │   │   └── products.ts         # CRUD de produtos
│   │   └── components/
│   │       ├── product-form.tsx    # Formulário com upload
│   │       └── states/             # Loading/Error/Empty
│   ├── core/                       # Camada de domínio
│   │   ├── entities/               # Entidades de negócio
│   │   ├── repositories/           # Interfaces de repositórios
│   │   ├── schemas/                # Validação Zod
│   │   └── use-cases/              # Lógica de negócio
│   ├── infrastructure/             # Implementações
│   │   └── repositories/           # Repositórios concretos
│   ├── lib/                        # Utilitários
│   │   ├── firebase.ts             # Config Firebase (Firestore)
│   │   └── cloudinary.service.ts   # Upload Cloudinary
│   └── components/ui/              # Componentes Chakra UI
├── docs/
│   ├── ARCHITECTURE.md             # Arquitetura detalhada
│   ├── BACKEND-QUICKSTART.md       # Guia rápido backend
│   ├── EXAMPLES.md                 # Exemplos práticos
│   ├── PRODUCT-FORM-GUIDE.md       # Guia do formulário
│   ├── QUICK-START.md              # Setup Firebase
│   └── STATE-COMPONENTS.md         # Componentes de estado
├── .env.local.example              # Template de variáveis
└── package.json
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
6. **Carrinho de Compras** com Context API
7. **Página de Confirmação** pós-checkout

---

## 🛒 WhatsApp Checkout

O projeto inclui integração com WhatsApp para checkout seguro:

### Características
- 🔒 **Seguro**: Preços calculados no servidor
- 💬 **Simples**: Redirecionamento direto para WhatsApp
- 📱 **Mobile-First**: Funciona em qualquer dispositivo
- ✅ **Validado**: Verifica estoque e disponibilidade

### Como Usar

1. **Adicione ao .env.local:**
```bash
NEXT_PUBLIC_SHOP_WHATSAPP_NUMBER=5511999999999
```

2. **Use o componente:**
```tsx
import { WhatsAppCheckoutButton } from "@/app/components/whatsapp-checkout-button";

<WhatsAppCheckoutButton
  cart={[
    { productId: "abc123", quantity: 2 },
    { productId: "def456", quantity: 1 }
  ]}
  onSuccess={(total) => console.log("Total:", total)}
/>
```

3. **Teste:**
- Acesse: http://localhost:3001/teste-checkout
- Substitua os IDs por produtos reais do Firestore

📖 **Documentação completa:** [docs/WHATSAPP_CHECKOUT.md](./docs/WHATSAPP_CHECKOUT.md)

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
