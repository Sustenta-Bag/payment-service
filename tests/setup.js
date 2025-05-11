// Arquivo de configuração para testes com Jest
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const config = require('../src/config/config');

// Configurar ambiente para testes
config.env = 'test';

let mongoServer;

// Configuração dos mocks
jest.mock('../src/services/rabbitMQ', () => ({
  connect: jest.fn().mockResolvedValue(true),
  publish: jest.fn().mockResolvedValue(true),
  consume: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/services/mercadoPago', () => ({
  createPreference: jest.fn().mockImplementation((paymentData) => {
    return Promise.resolve({
      id: 'test-preference-id',
      init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test-preference-id',
      sandbox_init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test-preference-id',
      metadata: {
        externalReference: paymentData.orderId,
        orderId: paymentData.orderId
      }
    });
  }),
  processWebhook: jest.fn().mockImplementation((notification) => {
    return Promise.resolve({
      status: 'approved',
      mercadopagoId: 'test-mp-id',
      paymentMethod: 'credit_card',
      metadata: {
        externalReference: 'test-order-id',
        orderId: 'test-order-id'
      }
    });
  })
}));

// Código para configurar o banco de dados em memória antes de todos os testes
beforeAll(async () => {
  // Configurar banco de dados MongoDB em memória
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Substituir a URI do MongoDB no objeto de configuração
  config.mongodb.uri = mongoUri;

  // Desconectar qualquer conexão existente antes de criar uma nova
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  await mongoose.connect(mongoUri);
});

// Limpar coleções após cada teste
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Fechar conexão e servidor após finalizar todos os testes
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Desabilitar logs durante os testes
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));
