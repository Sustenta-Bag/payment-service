# Guia de Testes Manuais

Este documento explica como testar manualmente o serviço de pagamento, incluindo como simular pagamentos e verificar os resultados.

## Pré-requisitos

- Serviço em execução (`npm run dev` ou via Docker)
- Acesso à documentação Swagger (`http://localhost:3001/api-docs`)
- [Opcional] Cliente HTTP como Postman ou Insomnia

## 1. Verificar Status do Serviço

```bash
curl http://localhost:3001/health
```

Resposta esperada:
```json
{
  "status": "OK",
  "timestamp": "2025-05-11T04:15:00.000Z"
}
```

## 2. Criar um Novo Pagamento

**Requisição:**
```bash
curl -X POST http://localhost:3001/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "items": [
      {
        "title": "Produto de Teste",
        "description": "Descrição do produto",
        "quantity": 1,
        "unitPrice": 100
      }
    ],
    "payer": {
      "name": "Usuário Teste",
      "email": "teste@example.com",
      "identification": {
        "type": "CPF",
        "number": "12345678909"
      }
    },
    "callbackUrl": "https://seusite.com/callback"
  }'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "paymentId": "6123456789abcdef12345678",
    "orderId": "ord-1234567890",
    "amount": 100,
    "paymentUrl": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123456789"
  }
}
```

## 3. Consultar um Pagamento

Usando o `paymentId` obtido na criação:

```bash
curl http://localhost:3001/api/payments/6123456789abcdef12345678
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "_id": "6123456789abcdef12345678",
    "orderId": "ord-1234567890",
    "userId": "user123",
    "amount": 100,
    "items": [...],
    "status": "pending",
    "createdAt": "2025-05-11T04:15:00.000Z",
    "updatedAt": "2025-05-11T04:15:00.000Z"
  }
}
```

## 4. Simular um Pagamento (Ambiente de Desenvolvimento)

### 4.1 Listar Pagamentos Disponíveis

```bash
curl http://localhost:3001/api/test/payments
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": "6123456789abcdef12345678",
      "orderId": "ord-1234567890",
      "status": "pending",
      "amount": 100,
      "createdAt": "2025-05-11T04:15:00.000Z"
    }
  ]
}
```

### 4.2 Simular Atualização de Pagamento

```bash
curl -X POST http://localhost:3001/api/test/simulate-payment \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ord-1234567890",
    "status": "approved",
    "fcmToken": "device-fcm-token-123"
  }'
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "paymentId": "6123456789abcdef12345678",
    "orderId": "ord-1234567890",
    "status": "approved",
    "notificationSent": true
  }
}
```

## 5. Verificar Atualizações de Status

Após simular a atualização, verifique se o pagamento foi atualizado:

```bash
curl http://localhost:3001/api/payments/6123456789abcdef12345678
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "_id": "6123456789abcdef12345678",
    "orderId": "ord-1234567890",
    "userId": "user123",
    "amount": 100,
    "items": [...],
    "status": "approved",  // Status atualizado
    "createdAt": "2025-05-11T04:15:00.000Z",
    "updatedAt": "2025-05-11T04:15:10.000Z"  // Horário atualizado
  }
}
```

## 6. Testar Webhook (Simulação de Mercado Pago)

Simule um webhook do Mercado Pago:

```bash
curl -X POST http://localhost:3001/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment.updated",
    "data": {
      "id": "12345678"
    }
  }'
```

**Resposta Esperada:**
```
OK
```

> **Nota:** Esta requisição simulará o processamento de um webhook do Mercado Pago. O serviço deve buscar o pagamento, atualizá-lo e publicar uma mensagem no RabbitMQ.

## 7. Verificar Mensagens no RabbitMQ (Interface de Gerenciamento)

1. Acesse a interface web do RabbitMQ (geralmente em `http://localhost:15672`)
2. Faça login com suas credenciais (padrão: guest/guest)
3. Navegue até a fila `payment_results`
4. Verifique se há mensagens sobre o pagamento atualizado

## 8. Verificar Registros (Logs)

Examine os logs do serviço para confirmar o processamento correto:

```bash
docker logs payment-service
```

ou visualize os logs de desenvolvimento no terminal onde o serviço está em execução.

## Resolução de Problemas

Se os testes manuais falharem, verifique:

1. **Conexões**: MongoDB e RabbitMQ estão acessíveis?
2. **Variáveis de Ambiente**: As configurações no `.env` estão corretas?
3. **Logs**: Examine os logs para encontrar erros específicos
4. **Ambiente**: Confirme que está em modo de desenvolvimento para usar os endpoints de teste
