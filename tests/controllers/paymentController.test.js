const mongoose = require('mongoose');
const paymentController = require('../../src/controllers/paymentController');
const Payment = require('../../src/models/payment');
const mercadoPagoService = require('../../src/services/mercadoPago');
const rabbitMQService = require('../../src/services/rabbitMQ');

// Mock para o objeto de resposta (res)
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Dados de exemplo para testes
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

describe('Payment Controller', () => {
  describe('createPayment', () => {
    it('deve criar um novo pagamento com sucesso', async () => {
      // Arrange
      const req = {
        body: samplePaymentData
      };
      const res = mockResponse();

      // Act
      await paymentController.createPayment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(true);
      expect(res.json.mock.calls[0][0].data).toHaveProperty('paymentId');
      expect(res.json.mock.calls[0][0].data).toHaveProperty('orderId');
      expect(res.json.mock.calls[0][0].data).toHaveProperty('amount');
      expect(res.json.mock.calls[0][0].data).toHaveProperty('paymentUrl');

      // Verificar se o pagamento foi salvo no banco de dados
      const payment = await Payment.findById(res.json.mock.calls[0][0].data.paymentId);
      expect(payment).not.toBeNull();
      expect(payment.userId).toBe(samplePaymentData.userId);
      expect(payment.amount).toBe(21); // 2 items * 10.5
      expect(payment.items).toHaveLength(1);
      expect(payment.status).toBe('pending');

      // Verificar se o serviço do Mercado Pago foi chamado
      expect(mercadoPagoService.createPreference).toHaveBeenCalled();

      // Verificar se a mensagem foi publicada no RabbitMQ
      expect(rabbitMQService.publish).toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando dados estiverem incompletos', async () => {
      // Arrange
      const req = {
        body: {
          userId: 'testuser123'
          // items e payer ausentes
        }
      };
      const res = mockResponse();

      // Act
      await paymentController.createPayment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(false);
      expect(res.json.mock.calls[0][0]).toHaveProperty('message');
    });

    it('deve retornar erro 500 quando ocorrer um erro interno', async () => {
      // Arrange
      const req = {
        body: samplePaymentData
      };
      const res = mockResponse();

      // Forçando um erro
      jest.spyOn(mercadoPagoService, 'createPreference').mockRejectedValueOnce(new Error('Erro forçado'));

      // Act
      await paymentController.createPayment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(false);
      expect(res.json.mock.calls[0][0]).toHaveProperty('message');
      expect(res.json.mock.calls[0][0]).toHaveProperty('error');
    });
  });

  describe('getPayment', () => {
    it('deve retornar um pagamento existente', async () => {
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
        params: {
          id: payment._id.toString()
        }
      };
      const res = mockResponse();

      // Act
      await paymentController.getPayment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(true);
      expect(res.json.mock.calls[0][0].data).toHaveProperty('_id');
      expect(res.json.mock.calls[0][0].data._id.toString()).toBe(payment._id.toString());
    });

    it('deve retornar 404 quando o pagamento não existir', async () => {
      // Arrange
      const nonExistentId = new mongoose.Types.ObjectId();
      const req = {
        params: {
          id: nonExistentId.toString()
        }
      };
      const res = mockResponse();

      // Act
      await paymentController.getPayment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(false);
      expect(res.json.mock.calls[0][0]).toHaveProperty('message');
    });
  });

  describe('webhook', () => {
    it('deve processar um webhook do Mercado Pago e atualizar o pagamento', async () => {
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
          action: 'payment.updated',
          data: {
            id: '12345678'
          }
        }
      };
      const res = mockResponse();

      // Mock do processWebhook
      mercadoPagoService.processWebhook.mockResolvedValueOnce({
        status: 'approved',
        mercadopagoId: 'mp-123456',
        paymentMethod: 'credit_card',
        metadata: {
          externalReference: 'test-order-id',
          orderId: 'test-order-id'
        }
      });

      // Act
      await paymentController.webhook(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('OK');

      // Verificar se o processWebhook foi chamado
      expect(mercadoPagoService.processWebhook).toHaveBeenCalledWith(req.body);

      // Verificar se o pagamento foi atualizado
      const updatedPayment = await Payment.findOne({ orderId: 'test-order-id' });
      expect(updatedPayment).not.toBeNull();
      expect(updatedPayment.status).toBe('approved');
      expect(updatedPayment.mercadopagoId).toBe('mp-123456');
      expect(updatedPayment.paymentMethod).toBe('credit_card');

      // Verificar se a mensagem foi publicada no RabbitMQ
      expect(rabbitMQService.publish).toHaveBeenCalled();
    });    it('deve responder 200 mesmo quando o webhook não contém informações de pagamento', async () => {
      // Arrange
      const req = {
        body: {
          action: 'non_payment_action',
          data: {}
        }
      };
      const res = mockResponse();

      // Reset any previous calls to rabbitMQService.publish
      rabbitMQService.publish.mockClear();
      
      // Mock do processWebhook retornando null (não é um evento de pagamento)
      mercadoPagoService.processWebhook.mockResolvedValueOnce(null);

      // Act
      await paymentController.webhook(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('OK');
      
      // Verificar se nenhuma mensagem foi publicada (não deveria ter publicado nada)
      expect(rabbitMQService.publish).not.toHaveBeenCalled();
    });
  });
});
