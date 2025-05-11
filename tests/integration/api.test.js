const request = require('supertest');
const app = require('../../src/app');
const Payment = require('../../src/models/payment');
const rabbitMQService = require('../../src/services/rabbitMQ');
const mercadoPagoService = require('../../src/services/mercadoPago');
const config = require('../../src/config/config');

// Force development environment for tests
config.env = 'development';

describe('API Integration', () => {
  describe('GET /health', () => {
    it('deve retornar status 200 OK', async () => {
      const response = await request(app).get('/health');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Rotas de pagamento', () => {
    const samplePaymentData = {
      userId: 'testuser123',
      items: [
        {
          title: 'Produto Teste',
          description: 'Descrição do produto',
          quantity: 2,
          unitPrice: 10.5
        }
      ],
      payer: {
        name: 'Usuário Teste',
        email: 'teste@example.com',
        identification: {
          type: 'CPF',
          number: '12345678909'
        }
      },
      callbackUrl: 'https://example.com/callback'
    };

    it('deve criar um novo pagamento via POST /api/payments', async () => {
      const response = await request(app)
        .post('/api/payments')
        .send(samplePaymentData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentId');
      expect(response.body.data).toHaveProperty('orderId');
      expect(response.body.data).toHaveProperty('amount');
      expect(response.body.data).toHaveProperty('paymentUrl');

      // Verificar se o pagamento foi salvo no banco de dados
      const payment = await Payment.findById(response.body.data.paymentId);
      expect(payment).not.toBeNull();
      expect(payment.userId).toBe(samplePaymentData.userId);
      expect(payment.amount).toBe(21); // 2 items * 10.5
    });

    it('deve retornar um pagamento existente via GET /api/payments/:id', async () => {
      // Primeiro, cria um pagamento
      const payment = new Payment({
        orderId: 'test-order-id',
        userId: 'testuser123',
        amount: 21,
        items: [{
          title: 'Produto Teste',
          description: 'Descrição do produto',
          quantity: 2,
          unitPrice: 10.5
        }],
        status: 'pending'
      });
      await payment.save();

      // Faz requisição para buscar o pagamento
      const response = await request(app).get(`/api/payments/${payment._id}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id', payment._id.toString());
      expect(response.body.data).toHaveProperty('orderId', 'test-order-id');
      expect(response.body.data).toHaveProperty('status', 'pending');
    });

    it('deve retornar 404 para um pagamento inexistente', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // ID válido mas não existente
      const response = await request(app).get(`/api/payments/${nonExistentId}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });    it('deve processar um webhook do Mercado Pago via POST /api/payments/webhook', async () => {
      // Criar um pagamento para ser atualizado
      const payment = new Payment({
        orderId: 'test-order-id',
        userId: 'testuser123',
        amount: 21,
        items: [{
          title: 'Produto Teste',
          description: 'Descrição do produto',
          quantity: 2,
          unitPrice: 10.5
        }],
        status: 'pending'
      });
      await payment.save();

      // Mock do processWebhook para retornar dados com o orderId correto
      mercadoPagoService.processWebhook.mockImplementationOnce(() => {
        return Promise.resolve({
          status: 'approved',
          mercadopagoId: 'mp-123456',
          paymentMethod: 'credit_card',
          metadata: {
            externalReference: 'test-order-id',
            orderId: 'test-order-id'
          }
        });
      });

      // Fazer a requisição de webhook
      const response = await request(app)
        .post('/api/payments/webhook')
        .send({
          action: 'payment.updated',
          data: {
            id: '12345678'
          }
        });

      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('OK');

      // Aguardar um momento para que a atualização seja concluída de forma assíncrona
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verificar se o pagamento foi atualizado
      const updatedPayment = await Payment.findOne({ orderId: 'test-order-id' });
      expect(updatedPayment.status).toBe('approved');
      expect(updatedPayment.mercadopagoId).toBe('mp-123456');
      expect(updatedPayment.paymentMethod).toBe('credit_card');
    });
  });

  describe('Rotas de teste', () => {
    it('deve listar pagamentos via GET /api/test/payments', async () => {
      // Criar alguns pagamentos de teste
      await Promise.all([
        new Payment({
          orderId: 'order-id-1',
          userId: 'user-id-1',
          amount: 21,
          status: 'pending'
        }).save(),
        new Payment({
          orderId: 'order-id-2',
          userId: 'user-id-2',
          amount: 42,
          status: 'approved'
        }).save()
      ]);

      const response = await request(app).get('/api/test/payments');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('orderId');
      expect(response.body.data[0]).toHaveProperty('status');
      expect(response.body.data[0]).toHaveProperty('amount');
    });

    it('deve simular um pagamento via POST /api/test/simulate-payment', async () => {
      // Criar um pagamento para simular
      const payment = new Payment({
        orderId: 'test-order-id-simulate',
        userId: 'testuser123',
        amount: 21,
        items: [{
          title: 'Produto Teste',
          description: 'Descrição do produto',
          quantity: 2,
          unitPrice: 10.5
        }],
        status: 'pending'
      });
      await payment.save();

      const response = await request(app)
        .post('/api/test/simulate-payment')
        .send({
          orderId: 'test-order-id-simulate',
          status: 'approved',
          fcmToken: 'test-fcm-token-123'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentId');
      expect(response.body.data).toHaveProperty('orderId', 'test-order-id-simulate');
      expect(response.body.data).toHaveProperty('status', 'approved');
      expect(response.body.data).toHaveProperty('notificationSent', true);

      // Verificar se o pagamento foi atualizado
      const updatedPayment = await Payment.findOne({ orderId: 'test-order-id-simulate' });
      expect(updatedPayment.status).toBe('approved');

      // Verificar se as mensagens foram publicadas no RabbitMQ
      expect(rabbitMQService.publish).toHaveBeenCalled();
    });

    it('deve retornar erro quando fcmToken não for fornecido', async () => {
      const response = await request(app)
        .post('/api/test/simulate-payment')
        .send({
          orderId: 'test-order-id',
          status: 'approved'
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro para um pagamento inexistente', async () => {
      const response = await request(app)
        .post('/api/test/simulate-payment')
        .send({
          orderId: 'nonexistent-order-id',
          status: 'approved',
          fcmToken: 'test-fcm-token'
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });
  });
});
