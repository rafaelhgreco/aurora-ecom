# Aurora E-commerce

Loja virtual com painel administrativo para pequenos varejistas que vendem pelo WhatsApp. O catálogo, o estoque e os pedidos passam a ser geridos em um único sistema, e o fechamento da venda continua na conversa com o cliente.

## Sumário

- [Problema de negócio](#problema-de-negócio)
- [Solução](#solução)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Fluxo de pedido](#fluxo-de-pedido)
- [Stack](#stack)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Configuração e execução](#configuração-e-execução)
- [Scripts](#scripts)
- [Documentação complementar](#documentação-complementar)

## Problema de negócio

Pequenas lojas costumam vender por WhatsApp com catálogo em planilhas ou em mensagens soltas. Isso gera:

- preços e promoções divergentes entre o que foi anunciado e o que é cobrado;
- venda de itens sem estoque, principalmente em produtos com variações de tamanho e cor;
- pedidos sem registro estruturado, o que impede conciliar vendas e estoque;
- cadastro lento de produtos, feito item a item.

## Solução

O cliente navega pela loja e monta o carrinho. Na finalização, o servidor recalcula preços e promoções, valida o estoque, registra o pedido e devolve um link de WhatsApp com a mensagem já formatada. O lojista acompanha os pedidos no painel e, ao finalizar uma venda, o estoque é baixado automaticamente.

## Funcionalidades

- Catálogo público com filtros por categoria, páginas de produto por slug e seções configuráveis.
- Carrinho com variações de tamanho e cor.
- Checkout via WhatsApp com preços calculados no servidor.
- Painel administrativo protegido por papel (`admin`): produtos, categorias, promoções, pedidos e revisão.
- Importação em massa de produtos por planilha XLSX, com validação por linha e modelo para download.
- Conferência de estoque por leitura de código de barras pela câmera.
- Exportação de auditoria de pedidos em XLSX.
- Upload de imagens no Cloudinary.
- Feature flags para promoções, desativação lógica e ferramentas de estoque.

## Arquitetura

Aplicação Next.js full-stack em camadas, no estilo Clean Architecture, sem API REST própria: as mutações são expostas como Server Actions.

| Camada           | Diretório            | Responsabilidade                                                                  |
| ---------------- | -------------------- | --------------------------------------------------------------------------------- |
| Apresentação     | `src/app`            | Páginas (App Router), componentes, Server Actions, middleware e configuração de rotas. |
| Domínio          | `src/core`           | Entidades, schemas Zod, interfaces de repositório e casos de uso. Não depende de framework. |
| Infraestrutura   | `src/infrastructure` | Repositórios Firestore, Cloudinary, importação e exportação XLSX.                 |
| Compartilhado    | `src/shared`         | Funções puras (preço, dinheiro, slug, estoque) e tratamento de erros.             |

Decisões principais:

- **Server Actions** em vez de API Routes: tipagem ponta a ponta e menos código de integração. A única rota HTTP é `api/cloudinary/delete`.
- **Zod como fonte da verdade**: os schemas validam a entrada e geram os tipos do domínio.
- **Repository pattern**: os casos de uso dependem de interfaces; há implementações Firestore (produção) e em memória (testes).
- **Preço calculado no servidor**: o cliente envia apenas `productId`, quantidade e variação. O valor final nunca vem do navegador.
- **Autenticação por JWT em cookie** (`jose`), verificada no middleware, que aplica controle de acesso por papel nas rotas `/admin`.
- **Erros padronizados**: erros de domínio são convertidos em um `ActionResult` com mensagens seguras para o cliente.

## Fluxo de pedido

1. O cliente adiciona itens ao carrinho e escolhe finalizar pelo WhatsApp.
2. A Server Action valida os itens, busca os produtos e promoções e recalcula os preços.
3. O pedido é salvo na coleção `orders` com status `PENDENTE`.
4. A ação retorna a URL do WhatsApp e o cliente é redirecionado.
5. No painel, o administrador altera o status para `FINALIZADA` ou `DECLINADA`.
6. Ao finalizar, o estoque de cada item (`stock` ou `stockBySize`) é decrementado.

Detalhes em [docs/ORDER_AUTOMATION.md](./docs/ORDER_AUTOMATION.md).

## Stack

| Área           | Tecnologia                                    |
| -------------- | --------------------------------------------- |
| Framework      | Next.js 16 (App Router), React 19             |
| Linguagem      | TypeScript                                    |
| UI             | Chakra UI v3                                  |
| Formulários    | React Hook Form + Zod                         |
| Dados          | Firebase Admin SDK (Firestore), TanStack Query |
| Imagens        | Cloudinary                                    |
| Planilhas      | ExcelJS                                       |
| Leitura de código de barras | ZXing                           |
| Qualidade      | Biome, Vitest, Husky, lint-staged             |

## Estrutura do projeto

```
src/
  app/
    (public)/        loja, produto, sobre, login
    (admin)/admin/   produtos, categorias, promoções, pedidos, importação, revisão
    actions/         Server Actions (produtos, checkout, pedidos, importação, estoque)
    api/cloudinary/  remoção de imagens
    components/      componentes de UI por contexto
    config/          rotas e feature flags
  core/
    entities/        carrinho e produto
    schemas/         validações Zod
    repositories/    contratos de persistência
    use-cases/       regras de negócio
    import/          leitura e validação da planilha
  infrastructure/
    repositories/    Firestore e em memória
    lib/             Firebase Admin e Cloudinary
    import/ export/  geração e leitura de XLSX
  shared/            funções puras e erros
scripts/             seeds e migrações pontuais
docs/                documentação complementar
```

## Configuração e execução

Pré-requisitos: Node.js 20+, Yarn, um projeto Firebase com Firestore e uma conta Cloudinary.

```bash
yarn install
yarn seed:admin
yarn dev
```

## Scripts

| Comando                         | Descrição                               |
| ------------------------------- | --------------------------------------- |
| `yarn dev`                      | Servidor de desenvolvimento             |
| `yarn build` / `yarn start`     | Build e execução de produção            |
| `yarn test`                     | Testes unitários (Vitest)               |
| `yarn lint` / `yarn format`     | Verificação e formatação (Biome)        |
| `yarn typecheck`                | Checagem de tipos                       |
| `yarn seed:admin`               | Cria o usuário administrador            |
| `yarn seed:sections`            | Cria as seções iniciais da loja         |
| `yarn backfill:product-slugs`   | Gera slugs para produtos existentes     |

## Documentação complementar

- [Automação de pedidos](./docs/ORDER_AUTOMATION.md)
- [Planilha de exemplo para importação](./docs/exemplos/aurora-produtos-importacao-exemplo.xlsx)
