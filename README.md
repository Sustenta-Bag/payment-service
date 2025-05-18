# payment-service

Microserviço de simulação de pagamentos usando Node.js, Express e RabbitMQ.

## Funcionalidades

- Criação de solicitações de pagamento
- Interface de simulação para aprovação, rejeição ou deixar pagamentos pendentes
- Processamento de notificações de pagamento
- Publicação de eventos em filas RabbitMQ
- Envio de notificações via RabbitMQ após atualizações de pagamento
- Configuração Docker com MongoDB
- API RESTful com suporte completo a HATEOAS, caching e versionamento

## Requisitos

- Node.js 18+
- MongoDB
- RabbitMQ

## Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

## Execução

```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```


## API RESTful

O serviço implementa uma API RESTful completa seguindo os principais padrões e princípios:

### Arquitetura de Recursos

Recursos organizados hierarquicamente com URIs semânticas:
- `/api/payments` - Coleção de pagamentos
- `/api/payments/{id}` - Recurso de pagamento específico
- `/api/payments/{id}/cancel` - Ação de cancelamento
- `/api/payments/{id}/refund` - Ação de reembolso

### HATEOAS (Hypermedia as the Engine of Application State)

Todas as respostas incluem links hipermídia que permitem navegação entre recursos:

```json
{
  "data": { 
    "paymentId": "123",
    "amount": 99.90,
    "status": "approved"
  },
  "_links": [
    {
      "rel": "self",
      "href": "/api/payments/123",
      "method": "GET"
    },
    {
      "rel": "refund",
      "href": "/api/payments/123/refund",
      "method": "POST"
    }
  ]
}
```

### Negociação de Conteúdo

A API suporta múltiplos formatos através de negociação de conteúdo:

```bash
# JSON padrão
curl -X GET http://localhost:3000/api/payments/123 \
  -H "Accept: application/json"

# Formato HAL
curl -X GET http://localhost:3000/api/payments/123 \
  -H "Accept: application/hal+json"

# Formato JSON:API
curl -X GET http://localhost:3000/api/payments/123 \
  -H "Accept: application/vnd.api+json"
```

### Cache HTTP

Implementa mecanismos de cache HTTP para otimizar requisições:
- ETags para validação de conteúdo
- Cabeçalhos Last-Modified para validação temporal
- Cache-Control para controle de cache do cliente

### Paginação de Coleções

Coleções de recursos implementam paginação com metadata e links de navegação:

```json
{
  "data": {
    "payments": [...],
    "_meta": {
      "totalItems": 50,
      "itemsPerPage": 10,
      "currentPage": 2,
      "totalPages": 5
    }
  },
  "_links": [
    {"rel": "first", "href": "/api/payments?page=1&limit=10"},
    {"rel": "prev", "href": "/api/payments?page=1&limit=10"},
    {"rel": "next", "href": "/api/payments?page=3&limit=10"},
    {"rel": "last", "href": "/api/payments?page=5&limit=10"}
  ]
}
```

### Versionamento de API

Suporte a versionamento por:
1. Cabeçalhos HTTP: `Accept: application/json; version=1.0.0`
2. Parâmetro de query: `?version=1.0.0`

### Perfis de Recursos (RFC 6906)

Documentação semântica dos recursos através de perfis:
- `/profiles/payment` - Documentação sobre o recurso de pagamento
- `/profiles/payment/schema.json` - Schema JSON para validação

Para informações detalhadas, consulte nossa [Documentação RESTful](RESTFUL-V2.md).

## Docker

```bash
# Construir imagem
docker build -t payment-service .

# Executar com docker-compose
docker-compose up -d
```

## Documentação

A documentação da API está disponível em `/api-docs` quando o serviço estiver em execução.

## Sistema de Notificações

O serviço de pagamento agora envia notificações aos usuários quando há alterações no status de pagamento:

### Fluxo de Notificações

1. **Simulação de Pagamento**: Quando um pagamento é processado através da rota `/api/payment-simulation/process`, o sistema:
   - Atualiza o status do pagamento no banco de dados
   - Envia uma notificação para o usuário sobre o status do pagamento
   - Publica um evento na exchange de RabbitMQ

2. **Webhook de Pagamento**: Quando um pagamento é atualizado via webhook, o sistema:
   - Atualiza o status do pagamento no banco de dados
   - Envia uma notificação para o usuário sobre o status do pagamento
   - Publica um evento na exchange de RabbitMQ

### Formato das Mensagens de Notificação

As notificações são enviadas para a exchange `process_notification_exchange` com a routing key `notification` no seguinte formato:

```json
{
  "token": "[token-fcm-do-usuario]",
  "notification": {
    "title": "Pagamento aprovado",
    "body": "Seu pagamento no valor de R$99.90 foi aprovado com sucesso!"
  },
  "data": {
    "paymentId": "payment123",
    "orderId": "order123",
    "amount": 99.90,
    "status": "approved"
  },
  "timestamp": "2023-05-18T14:30:00.000Z"
}
```

### Testando o Sistema de Notificações

Para testar o envio de notificações, você pode simular um pagamento usando:

```bash
curl -X POST http://localhost:3001/api/payment-simulation/process \
  -H "Content-Type: application/json" \
  -d '{"orderId": "seu-order-id", "action": "approve"}'
```

Ou rejeitar um pagamento:

```bash
curl -X POST http://localhost:3001/api/payment-simulation/process \
  -H "Content-Type: application/json" \
  -d '{"orderId": "seu-order-id", "action": "reject"}'
```

### Integração com o Sistema de Notificações via RabbitMQ

O serviço de pagamento agora se integra com o serviço de notificações através do RabbitMQ:

1. Quando um pagamento é aprovado ou rejeitado, uma mensagem é enviada para a exchange de notificações
2. O serviço de notificações consome estas mensagens e trata o envio das notificações aos usuários

#### Configuração Necessária

Certifique-se de configurar as variáveis de ambiente relacionadas ao RabbitMQ:

```bash
# Configuração RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
```

O serviço enviará mensagens com o seguinte formato para a exchange `notifications_exchange` com a routing key `notification.send`:

```json
{
  "userId": "user123",
  "notification": {
    "title": "Pagamento aprovado",
    "body": "Seu pagamento no valor de R$99.90 foi aprovado com sucesso!"
  },
  "data": {
    "paymentId": "payment123",
    "orderId": "order123",
    "amount": 99.90,
    "status": "approved"
  },
  "timestamp": "2023-05-18T14:30:00.000Z"
}
```

## Licença

Este projeto está licenciado sob a licença ISC.