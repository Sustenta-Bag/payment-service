const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Aumentando o timeout para testes
jest.setTimeout(30000);

// Configuração antes de todos os testes
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  await mongoose.connect(mongoUri);
});

// Limpeza após cada teste
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// Limpeza após todos os testes
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
}); 