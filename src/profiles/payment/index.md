# Profile para Recurso de Pagamento

Este documento descreve a semântica de um recurso de pagamento na API RESTful.

## Descrição

Um recurso de pagamento representa uma transação financeira no sistema. Ele contém informações sobre o pedido relacionado, o usuário que solicitou o pagamento, o valor, e o status atual da transação.

## Estados

Um pagamento pode estar em um dos seguintes estados:

* `pending`: Pagamento pendente, aguardando processamento.
* `approved`: Pagamento aprovado e processado com sucesso.
* `rejected`: Pagamento rejeitado pelo processador de pagamentos.
* `cancelled`: Pagamento cancelado pelo usuário ou sistema.
* `refunded`: Pagamento estornado após aprovação.

## Transições de Estado

As transições de estado permitidas são:

* `pending` → `approved` (após aprovação do processador de pagamentos)
* `pending` → `rejected` (após rejeição do processador de pagamentos)
* `pending` → `cancelled` (após cancelamento pelo usuário)
* `approved` → `refunded` (após estorno)

## Ações

As ações disponíveis para um pagamento dependem do seu estado atual:

* Todos os pagamentos podem ser consultados.
* Pagamentos `pending` podem ser cancelados.
* Pagamentos `approved` podem ser estornados.

## Relacionamentos

Um pagamento está relacionado a:

* Um usuário que iniciou a transação.
* Um conjunto de itens sendo pagos.

## Representações

Um recurso de pagamento pode ser representado em diferentes formatos:

* `application/json` - Representação JSON padrão
* `application/hal+json` - Representação HAL com links HATEOAS
* `application/vnd.api+json` - Representação JSON:API

## Links

Um recurso de pagamento geralmente contém links para:

* `self` - O próprio recurso de pagamento
* `cancel` - Cancelar o pagamento (se aplicável)
* `refund` - Estornar o pagamento (se aplicável)
* `payments` - Lista de todos os pagamentos

## Exemplo de Uso

```json
{
  "success": true,
  "data": {
    "paymentId": "60d21b4667d0d8992e610c85",
    "orderId": "ORD-12345",
    "amount": 100.50,
    "status": "pending"
  },
  "_links": [
    {
      "rel": "self",
      "href": "http://localhost:3001/api/payments/60d21b4667d0d8992e610c85",
      "method": "GET"
    },
    {
      "rel": "cancel",
      "href": "http://localhost:3001/api/payments/60d21b4667d0d8992e610c85/cancel",
      "method": "POST"
    }
  ]
}
```
