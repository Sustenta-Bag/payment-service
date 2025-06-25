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
- **Buscar pagamentos** por Order ID para integração com outros sistemas

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
| `POST /api/payments` | POST | Cria um novo pagamento |
| `GET /api/payments` | GET | Lista todos os pagamentos com paginação |
| `GET /api/payments/{id}` | GET | Obtém informações de um pagamento por ID |
| `POST /api/payments/{id}/cancel` | POST | Cancela um pagamento |
| `POST /api/payments/{id}/refund` | POST | Reembolsa um pagamento |
| `GET /api/payments/order/{orderId}` | GET | Obtém informações de um pagamento por Order ID |
| `GET /api/payments/user/{userId}` | GET | Obtém todos os pagamentos de um usuário com filtros opcionais |

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

### Obter Pagamento por Order ID
```bash
curl "http://localhost:3000/api/payments/order/order456"
```

### Cancelar um Pagamento
```bash
curl -X POST http://localhost:3000/api/payments/{id}/cancel \
  -H "Content-Type: application/json"
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
# Servidor
PORT=3000
NODE_ENV=development

# Banco de dados
MONGODB_URI=mongodb://localhost:27017/payment-service

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/

# Configuração de Retry para RabbitMQ
MAX_RETRIES=5           # Número máximo de tentativas de conexão
RETRY_DELAY_MS=2000     # Delay entre tentativas em milissegundos

# APIs externas
MONOLITH_API_URL=http://localhost:8080
```

### Configuração de Retry RabbitMQ

O serviço implementa um sistema robusto de retry para conexões RabbitMQ:

- **MAX_RETRIES**: Número máximo de tentativas de conexão (padrão: 5)
- **RETRY_DELAY_MS**: Tempo de espera entre tentativas em ms (padrão: 2000)

#### Comportamento do Retry:

1. **Conexão Inicial**: Tenta conectar até MAX_RETRIES vezes
2. **Consumidores**: Reinicia automaticamente em caso de falha
3. **Publicação**: Retry automático para envio de mensagens
4. **Notificações**: Retry específico (3 tentativas) para envio de notificações

#### Monitoramento:

- **Health Check**: `/health` - Verifica status dos consumidores RabbitMQ
- **Logs**: Logs detalhados com emojis para facilitar debugging

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