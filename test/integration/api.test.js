const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const Payment = require('../../src/models/payment');
const rabbitMQService = require('../../src/services/rabbitMQ');

jest.mock('../../src/services/rabbitMQ');

describe('API de Pagamentos - Testes de Integração', () => {
  let mongod;
  let paymentId;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    await mongoose.disconnect();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await Payment.deleteMany({});
    rabbitMQService.publish.mockResolvedValue(true);
  });

  const mockPaymentData = {
    userId: 'user123',
    items: [
      {
        title: 'Produto 1',
        description: 'Descrição do produto 1',
        quantity: 2,
        unitPrice: 100
      }
    ],
    payer: {
      name: 'João Silva',
      email: 'joao@email.com'
    }
  };

  describe('POST /api/payments', () => {
    it('deve criar um novo pagamento', async () => {
      const response = await request(app)
        .post('/api/payments')
        .send(mockPaymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentId');
      expect(response.body.data).toHaveProperty('paymentUrl');
      expect(response.body.data).toHaveProperty('amount', 200);
      
      paymentId = response.body.data.paymentId;

      const savedPayment = await Payment.findById(paymentId);
      expect(savedPayment).toBeTruthy();
      expect(savedPayment.userId).toBe(mockPaymentData.userId);
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const invalidData = { ...mockPaymentData };
      delete invalidData.items;

      const response = await request(app)
        .post('/api/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Dados incompletos para criação do pagamento');
    });
  });

  describe('GET /api/payments/:id', () => {
    it('deve retornar um pagamento existente', async () => {
      // Primeiro cria um pagamento
      const createResponse = await request(app)
        .post('/api/payments')
        .send(mockPaymentData);
      
      const paymentId = createResponse.body.data.paymentId;

      // Depois busca o pagamento criado
      const response = await request(app)
        .get(`/api/payments/${paymentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id', paymentId);
      expect(response.body.data).toHaveProperty('userId', mockPaymentData.userId);
    });

    it('deve retornar 404 para pagamento inexistente', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/payments/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Pagamento não encontrado');
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('deve processar notificação de pagamento', async () => {
      // Primeiro cria um pagamento
      const createResponse = await request(app)
        .post('/api/payments')
        .send(mockPaymentData);
      
      const orderId = createResponse.body.data.orderId;

      const mockNotification = {
        type: 'payment',
        data: {
          id: 'payment123',
          orderId: orderId,
          status: 'approved',
          paymentMethod: 'credit_card'
        }
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .send(mockNotification)
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body._links).toBeDefined();
    });

    it('deve aceitar notificação mesmo para pagamento não encontrado', async () => {
      const mockNotification = {
        type: 'payment',
        data: {
          id: 'payment123',
          orderId: 'non-existent-order',
          status: 'approved',
          paymentMethod: 'credit_card'
        }
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .send(mockNotification)
        .expect(202);

      expect(response.body.success).toBe(true);
    });
  });
}); 