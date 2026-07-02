# Prompt para Grok Builder - Cadastro de Produtos em Massa

**Título da Feature:** Cadastro de Produtos em Massa via Planilha

**Descrição Geral:**
Criar um novo módulo **independente** do cadastro individual de produtos, permitindo o cadastro em massa através de uma planilha Excel (.xlsx). O sistema deve validar os dados, processar em lotes e cadastrar corretamente seguindo a estrutura atual do `ProductEntity` no Firestore.

---

## 1. Estrutura Atual do Produto (Referência Obrigatória)

O builder deve analisar e respeitar exatamente a estrutura do `ProductEntity` utilizada no projeto:

```ts
{
  title: string;
  subtitle?: string;
  description: string;
  price: number;
  imageUrl: string;
  images: string[];                    // URLs completas do Cloudinary
  category?: string;
  shopCategory?: ShopCategoryId;
  stock: number;
  stockBySize?: Partial<Record<"PP" | "P" | "M" | "G" | "GG" | "XG", number>>;
  sizes?: Array<"PP" | "P" | "M" | "G" | "GG" | "XG">;
  colors?: string[];
  colorVariants?: Array<{
    color: string;
    images: string[];
    stockBySize: Partial<Record<"PP" | "P" | "M" | "G" | "GG" | "XG", number>>;
  }>;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}
```

**Características importantes do modelo atual:**
- Variantes são organizadas principalmente por **cor** (`colorVariants`).
- Cada cor possui seu próprio `images[]` e `stockBySize`.
- Existem campos agregados no produto: `colors[]`, `sizes[]`, `stockBySize` (total) e `stock`.
- Tamanhos suportados: **PP, P, M, G, GG, XG**.

---

## 2. Estratégia de Variantes

**Recomendação:** Usar **uma linha por cor** (color variant).

Exemplo: Um produto com 2 cores terá 2 linhas na planilha.  
Essa abordagem é a mais alinhada com o modelo de `colorVariants` atual.

O backend deve **agrupar automaticamente** as linhas que pertencem ao mesmo produto (usando `sku_base` ou `title`) e montar o `colorVariants[]` + campos agregados.

---

## 3. Estrutura do Template Excel (.xlsx)

O template deve conter **duas abas**:

### Aba 1: "Instruções"
- Explicação clara do funcionamento
- Regras de preenchimento
- Exemplo completo de pelo menos 2 produtos com múltiplas cores

### Aba 2: "Produtos" — Colunas recomendadas:

| Coluna                  | Tipo     | Obrigatório | Descrição                                      | Mapeamento no Firestore                  |
|-------------------------|----------|-------------|------------------------------------------------|------------------------------------------|
| `sku_base`              | Texto    | Sim         | Código base do produto                         | Usado para agrupar linhas do mesmo produto |
| `title`                 | Texto    | Sim         | Nome do produto                                | `title`                                  |
| `subtitle`              | Texto    | Não         | Subtítulo                                      | `subtitle`                               |
| `description`           | Texto    | Sim         | Descrição completa                             | `description`                            |
| `price`                 | Número   | Sim         | Preço de venda                                 | `price`                                  |
| `category`              | Texto    | Sim         | Ex: "Roupas"                                   | `category`                               |
| `shopCategory`          | Texto    | Não         | Ex: "roupas"                                   | `shopCategory`                           |
| `cor`                   | Texto    | Sim         | Nome da cor (ex: "Padrão", "Marrom")           | `colorVariants[].color` + `colors[]`     |
| `imagens_cor`           | Texto    | Não         | public_ids ou URLs separados por `\|` ou `,`   | `colorVariants[].images` + `images[]`    |
| `stock_PP`              | Número   | Não         | Quantidade no tamanho PP                       | `colorVariants[].stockBySize.PP`         |
| `stock_P`               | Número   | Não         | Quantidade no tamanho P                        | `colorVariants[].stockBySize.P`          |
| `stock_M`               | Número   | Não         | Quantidade no tamanho M                        | `colorVariants[].stockBySize.M`          |
| `stock_G`               | Número   | Não         | Quantidade no tamanho G                        | `colorVariants[].stockBySize.G`          |
| `stock_GG`              | Número   | Não         | Quantidade no tamanho GG                       | `colorVariants[].stockBySize.GG`         |
| `stock_XG`              | Número   | Não         | Quantidade no tamanho XG                       | `colorVariants[].stockBySize.XG`         |
| `isActive`              | Texto    | Sim         | `sim` ou `não`                                 | `isActive`                               |
| `imageUrl_principal`    | Texto    | Não         | Imagem principal do produto                    | `imageUrl`                               |

**Regras do template:**
- Repetir os campos base (`title`, `description`, `price`, etc.) nas linhas do mesmo produto.
- Usar `sku_base` para identificar que as linhas pertencem ao mesmo produto.
- Permitir que o usuário informe `public_id` ou URL completa do Cloudinary na coluna `imagens_cor`.

---

## 4. Lógica de Processamento e Mapeamento

O backend deve:

1. Agrupar as linhas pelo `sku_base` (ou `title` quando não houver).
2. Para cada grupo de produto:
   - Criar o documento base.
   - Montar o array `colorVariants[]`.
   - Popular automaticamente os campos agregados:
     - `colors[]` → lista única de cores
     - `sizes[]` → tamanhos que possuem estoque > 0
     - `stockBySize` → soma do estoque por tamanho entre todas as cores
     - `stock` → soma total de todos os estoques
     - `images[]` → união das imagens ou imagens da primeira cor
     - `imageUrl` → primeira imagem disponível
3. Usar `writeBatch` do Firebase com **chunks de 200 a 400 operações** por lote (para respeitar o free tier).
4. Processar de forma assíncrona com feedback de progresso em tempo real.

---

## 5. Integração com Cloudinary

**Abordagem recomendada para a v1:**
- O usuário realiza **pré-upload manual** das fotos no Cloudinary.
- Na coluna `imagens_cor`, ele informa os `public_id` ou as URLs completas.
- O sistema deve aceitar ambos os formatos e normalizar para URLs completas no Firestore.

Essa é a abordagem mais estável e recomendada no momento.

---

## 6. Firebase - Estratégia de Cadastro em Massa (Free Tier)

- Utilizar **batched writes** (`writeBatch`).
- Dividir o processamento em chunks de **200~400 linhas** por lote.
- Processar de forma assíncrona (recomendado usar Cloud Function ou job no backend).
- Exibir progresso em tempo real para o usuário.
- Tratamento de erros parcial: continuar o processo e gerar relatório das linhas que falharam com o motivo.

---

## 7. Fluxo do Usuário (User Story)

1. Acessar o módulo **Cadastro em Massa**.
2. Clicar em **"Baixar Modelo de Planilha"**.
3. Preencher a planilha (repetindo os dados base nas cores do mesmo produto).
4. Fazer upload da planilha.
5. Sistema realiza validação e mostra erros por linha (se houver).
6. Usuário confirma o cadastro.
7. Processamento em background com barra de progresso.
8. Ao final, exibir resumo (sucessos × falhas) e permitir download do relatório de erros.

---

## 8. Requisitos Técnicos e Não-Funcionais

- Módulo **totalmente independente** do cadastro individual de produtos.
- Validação robusta (frontend + backend) com feedback claro por linha.
- Preview dos dados antes de confirmar o cadastro (recomendado).
- Segurança: apenas usuários autenticados com permissão podem acessar.
- Usar TypeScript e seguir os padrões de Clean Code e arquitetura do projeto.
- Respeitar os limites do Firebase plano gratuito.
- Criar o template Excel dinamicamente com boa formatação, aba de instruções e exemplo já preenchido.
- Logging da operação de import em massa.

---

## Instruções Finais para o Builder

1. Analise primeiro a estrutura atual do `ProductEntity` e dos documentos no Firestore para garantir mapeamento correto.
2. Priorize **usabilidade** para o usuário que preenche a planilha e **robustez** no processamento.
3. Decida a melhor forma de armazenar e agregar os dados (respeitando o modelo atual de `colorVariants`).
4. Implemente todo o fluxo: download do template, upload, validação, processamento em chunks, progresso e relatório final.

---

**Data de criação:** Julho 2026  
**Versão do Prompt:** Final Integrada