# Documentação de Testes

## Visão Geral

O serviço de pagamento utiliza Jest como framework de testes, possibilitando testes unitários, de integração e de ponta a ponta. A estrutura de testes foi organizada para maximizar a cobertura de código e garantir o funcionamento correto de todos os componentes do sistema.

## Estrutura de Testes

```
tests/
  ├── setup.js                    # Configuração global para testes
  ├── controllers/                # Testes dos controladores
  │   ├── paymentController.test.js
  │   └── testController.test.js
  ├── integration/               # Testes de integração da API
  │   └── api.test.js
  ├── services/                  # Testes dos serviços
  │   ├── mercadoPago.test.js
  │   └── rabbitMQ.test.js
  └── utils/                     # Testes das utilidades
      └── logger.test.js
```

## Estratégia de Testes

1. **Testes Unitários**: Focados em testar funções isoladas e componentes individuais.
2. **Testes de Integração**: Verificam a comunicação entre diferentes partes do sistema.
3. **Mocks e Stubs**: Utilizados para simular dependências externas (MongoDB, RabbitMQ, Mercado Pago).

## Ambiente de Testes

- **MongoDB**: Utiliza `mongodb-memory-server` para criar bancos de dados MongoDB em memória durante os testes, isolados do ambiente de produção.
- **RabbitMQ**: Mockado para simular a conexão e comportamentos sem necessidade de um servidor real.
- **Mercado Pago**: APIs externas são mockadas para retornar respostas predefinidas.

## Executando os Testes

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

## Cobertura de Código

Os testes atuais cobrem mais de 85% dos controladores, que são o componente principal da aplicação. Os serviços externos (RabbitMQ, Mercado Pago) são mockados para permitir testes isolados.

## Principais Classes de Teste

### Testes de Controladores

- `paymentController.test.js`: Testa a criação de pagamentos, obtenção de detalhes e processamento de webhooks.
- `testController.test.js`: Testa as funcionalidades de simulação de pagamentos para ambiente de desenvolvimento.

### Testes de Integração

- `api.test.js`: Testa todas as rotas HTTP da API, incluindo criação de pagamentos, obtenção de pagamentos e webhooks.

### Testes de Serviços

- `rabbitMQ.test.js`: Testa a conexão, publicação e consumo de mensagens no RabbitMQ.
- `mercadoPago.test.js`: Testa a integração com a API do Mercado Pago.

## Boas Práticas

1. **Isolamento**: Cada teste deve ser independente e não deve depender do estado de outros testes.
2. **Reset de Estado**: O banco de dados é limpo após cada teste para garantir isolamento.
3. **Mocks Consistentes**: Serviços externos são mockados de forma consistente.
4. **Cobertura Abrangente**: Busca cobrir caminho feliz e casos de erro.

## Melhorias Futuras

1. **Testes de Serviços**: Melhorar a cobertura de testes nos serviços de RabbitMQ e Mercado Pago.
2. **Testes E2E**: Implementar testes de ponta a ponta que verificam o fluxo completo do usuário.
3. **Testes de Stress**: Adicionar testes de carga para verificar o comportamento sob uso intensivo.
