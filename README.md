# payment-service

Microserviço de simulação de pagamentos usando Node.js, Express e RabbitMQ.

## Funcionalidades

- Criação de solicitações de pagamento
- Interface de simulação para aprovação, rejeição ou deixar pagamentos pendentes
- Processamento de notificações de pagamento
- Publicação de eventos em filas RabbitMQ
- Envio de notificações via RabbitMQ após atualizações de pagamento
- Configuração Docker com MongoDB

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

## Testes

```bash
# Executar todos os testes
npm test

# Executar testes com observação de alterações
npm run test:watch

# Executar testes com relatório de cobertura
npm run test:coverage

# Executar apenas testes de integração da API
npm run test:api

# Executar apenas testes dos controladores
npm run test:controllers
```

Para mais informações sobre testes, consulte:
- [Documentação de Testes](./docs/TESTING.md)
- [Guia de Testes Manuais](./docs/MANUAL_TESTING.md)

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