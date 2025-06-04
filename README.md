# Serviço de Pagamentos

Um microserviço Node.js para simulação de processamento de pagamentos com notificações em tempo real e API REST abrangente.

## O que este microserviço faz

Este serviço oferece um sistema completo de simulação de processamento de pagamentos que:

- **Cria solicitações de pagamento** com itens do carrinho e informações do pagador
- **Simula processamento de pagamentos** com estados de aprovação, rejeição ou pendente
- **Gerencia o ciclo de vida dos pagamentos** incluindo cancelamentos e reembolsos
- **Envia notificações em tempo real** aos usuários sobre mudanças no status do pagamento
- **Fornece API REST abrangente** com paginação, filtros e links HATEOAS
- **Integra com serviços externos** via webhooks e mensageria RabbitMQ

## Início Rápido

### Pré-requisitos
- Node.js 18+
- MongoDB
- RabbitMQ

### Instalação e Configuração
```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start
```

### Pontos de Acesso
- **API**: `http://localhost:3000/api`
- **Documentação**: `http://localhost:3000/api-docs` (Swagger)
- **Health Check**: `http://localhost:3000/health`

## Principais Funcionalidades

### 🔧 Gerenciamento de Pagamentos
- **Criar pagamentos** com itens, valores e detalhes do pagador
- **Acompanhar status do pagamento** (pendente → aprovado/rejeitado/cancelado/reembolsado)
- **Buscar pagamentos** por ID do usuário com filtros e paginação
- **Interface de simulação de pagamento** para testar fluxos de pagamento

### 📱 Notificações em Tempo Real
- Notificações automáticas aos usuários sobre mudanças no status do pagamento
- Integração com RabbitMQ para mensageria escalável
- Suporte a tokens FCM para notificações push mobile

### 🌐 API REST
- Implementação RESTful completa com HATEOAS
- Documentação Swagger abrangente com exemplos
- Negociação de conteúdo (JSON, HAL, JSON:API)
- Cache HTTP com ETags e cabeçalhos Last-Modified
- Paginação com metadados para todas as coleções

## Principais Endpoints da API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /api/payments` | POST | Criar um novo pagamento |
| `GET /api/payments` | GET | Listar todos os pagamentos (paginado) |
| `GET /api/payments/{id}` | GET | Obter detalhes do pagamento |
| `GET /api/payments/user/{userId}` | GET | Obter pagamentos do usuário (com filtros) |
| `POST /api/payments/{id}/cancel` | POST | Cancelar um pagamento pendente |
| `POST /api/payments/{id}/refund` | POST | Reembolsar um pagamento aprovado |
| `POST /api/payments/webhook` | POST | Receber notificações de pagamento |
| `GET /api/payment-simulation/{id}` | GET | Interface de simulação |
| `POST /api/payment-simulation/process` | POST | Processar simulação de pagamento |

## Exemplos de Uso

### Criar um Pagamento
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "orderId": "order456",
    "items": [
      {
        "title": "Produto A",
        "quantity": 2,
        "unitPrice": 50.00
      }
    ],
    "payer": {
      "email": "user@example.com",
      "name": "João Silva"
    }
  }'
```

### Obter Pagamentos do Usuário com Filtros
```bash
curl "http://localhost:3000/api/payments/user/user123?status=approved&page=1&limit=10"
```

### Simular Aprovação de Pagamento
```bash
curl -X POST http://localhost:3000/api/payment-simulation/process \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order456",
    "action": "approve"
  }'
```

## Deploy com Docker

```bash
# Construir e executar com Docker Compose
docker-compose up -d

# Ou construir manualmente
docker build -t payment-service .
docker run -p 3000:3000 payment-service
```

## Configuração do Ambiente

Principais variáveis de ambiente:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/payment-service
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
MONOLITH_API_URL=http://localhost:8080
NODE_ENV=development
```

## Testes

```bash
# Executar todos os testes
npm test

# Executar com cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

## Documentação

- **Documentação da API Swagger**: Disponível em `/api-docs` quando executando
- **Detalhes da Implementação REST**: Veja [RESTFUL-V2.md](RESTFUL-V2.md)
- **Exemplos abrangentes** incluídos na documentação Swagger

---

**Construído com**: Node.js, Express, MongoDB, RabbitMQ, Mongoose, Swagger