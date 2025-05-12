const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const config = require('../src/config/config');

config.env = 'test';

let mongoServer;

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

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  config.mongodb.uri = mongoUri;

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));
