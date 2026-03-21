# Order Automation

Sistema de gestão de pedidos via WhatsApp.

## Visão geral

1. **Criação**: Ao clicar em "Finalizar pelo WhatsApp", o pedido é salvo na coleção `orders` do Firestore antes de abrir o WhatsApp.
2. **Status**: `PENDENTE` → `DECLINADA` | `FINALIZADA`
3. **Estoque**: Ao marcar como `FINALIZADA`, o estoque dos produtos é decrementado automaticamente.

## Firestore

### Coleção `orders`

```ts
{
  id: string;
  items: Array<{
    productId: string;
    quantity: number;
    variants?: { size?: string; color?: string };
    title: string;
    price: number;
    subtotal: number;
  }>;
  total: number;
  status: "PENDENTE" | "DECLINADA" | "FINALIZADA";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Regras Firestore (sugestão)

```javascript
// orders: apenas admin (via Admin SDK) no servidor
// O cliente não acessa orders diretamente
```

## Fluxo

1. Cliente adiciona itens ao carrinho → clica "Finalizar pelo WhatsApp"
2. Server Action: valida itens, enriquece com preços, **cria documento em orders**
3. Retorna URL do WhatsApp → cliente é redirecionado
4. Admin acessa `/admin-pedidos` → vê lista de pedidos
5. Admin altera status (PENDENTE → FINALIZADA)
6. Ao finalizar: decrementa estoque de cada item (stock ou stockBySize)
