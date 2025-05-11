const mongoose = require('mongoose');
const testController = require('../../src/controllers/testController');
const Payment = require('../../src/models/payment');
const rabbitMQService = require('../../src/services/rabbitMQ');

// Mock para o objeto de resposta (res)
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Test Controller', () => {
  describe('simulatePayment', () => {
    it('deve simular uma atualização de pagamento', async () => {
      // Arrange
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

      const req = {
        body: {
          orderId: 'test-order-id',
          status: 'approved',
          fcmToken: 'test-fcm-token-123'
        }
      };
      const res = mockResponse();

      // Act
      await testController.simulatePayment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(true);
      expect(res.json.mock.calls[0][0].data).toHaveProperty('paymentId');
      expect(res.json.mock.calls[0][0].data).toHaveProperty('orderId');
      expect(res.json.mock.calls[0][0].data).toHaveProperty('status', 'approved');
      expect(res.json.mock.calls[0][0].data).toHaveProperty('notificationSent', true);

      // Verificar se o pagamento foi atualizado no banco de dados
      const updatedPayment = await Payment.findOne({ orderId: 'test-order-id' });
      expect(updatedPayment).not.toBeNull();
      expect(updatedPayment.status).toBe('approved');

      // Verificar se as mensagens foram publicadas no RabbitMQ
      expect(rabbitMQService.publish).toHaveBeenCalledTimes(2);
    });

    it('deve retornar erro 400 quando orderId não for fornecido', async () => {
      // Arrange
      const req = {
        body: {
          status: 'approved',
          fcmToken: 'test-fcm-token'
        }
      };
      const res = mockResponse();

      // Act
      await testController.simulatePayment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(false);
      expect(res.json.mock.calls[0][0]).toHaveProperty('message');
    });

    it('deve retornar erro 400 quando fcmToken não for fornecido', async () => {
      // Arrange
      const req = {
        body: {
          orderId: 'test-order-id',
          status: 'approved'
        }
      };
      const res = mockResponse();

      // Act
      await testController.simulatePayment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(false);
      expect(res.json.mock.calls[0][0]).toHaveProperty('message');
    });

    it('deve retornar erro 404 quando o pagamento não existir', async () => {
      // Arrange
      const req = {
        body: {
          orderId: 'nonexistent-order-id',
          status: 'approved',
          fcmToken: 'test-fcm-token'
        }
      };
      const res = mockResponse();

      // Act
      await testController.simulatePayment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(false);
      expect(res.json.mock.calls[0][0]).toHaveProperty('message');
    });
  });

  describe('listPayments', () => {
    it('deve listar os pagamentos existentes', async () => {
      // Arrange
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

      const req = {};
      const res = mockResponse();

      // Act
      await testController.listPayments(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(true);
      expect(res.json.mock.calls[0][0].data).toBeInstanceOf(Array);
      expect(res.json.mock.calls[0][0].data.length).toBe(2);
      expect(res.json.mock.calls[0][0].data[0]).toHaveProperty('id');
      expect(res.json.mock.calls[0][0].data[0]).toHaveProperty('orderId');
      expect(res.json.mock.calls[0][0].data[0]).toHaveProperty('status');
      expect(res.json.mock.calls[0][0].data[0]).toHaveProperty('amount');
    });

    it('deve retornar uma lista vazia quando não existirem pagamentos', async () => {
      // Arrange
      const req = {};
      const res = mockResponse();

      // Act
      await testController.listPayments(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(true);
      expect(res.json.mock.calls[0][0].data).toBeInstanceOf(Array);
      expect(res.json.mock.calls[0][0].data.length).toBe(0);
    });
  });
});
