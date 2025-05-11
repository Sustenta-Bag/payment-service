# payment-service

Microserviço de pagamentos usando Node.js, Express, RabbitMQ e Mercado Pago.

## Funcionalidades

- Criação de pagamentos via Mercado Pago
- Processamento de webhooks para atualizações de pagamento
- Publicação de eventos em filas RabbitMQ
- Notificações push (FCM) após atualizações de pagamento
- Configuração Docker com MongoDB
- Simulação de pagamentos (ambiente de desenvolvimento)

## Requisitos

- Node.js 18+
- MongoDB
- RabbitMQ
- Conta no Mercado Pago (para testes)

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

## Licença

Este projeto está licenciado sob a licença ISC.