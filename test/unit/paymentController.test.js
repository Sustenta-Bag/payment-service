const { createPayment, getPayment, webhook } = require('../../src/controllers/paymentController');
const Payment = require('../../src/models/payment');
const paymentSimulationService = require('../../src/services/paymentSimulation');
const rabbitMQService = require('../../src/services/rabbitMQ');
const notificationService = require('../../src/services/notificationService');

// Mock dos serviços
jest.mock('../../src/services/paymentSimulation');
jest.mock('../../src/services/rabbitMQ');
jest.mock('../../src/services/notificationService');
jest.mock('../../src/models/payment');

describe('PaymentController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
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
      },
      params: {},
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000')
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Reset dos mocks
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('deve criar um novo pagamento com sucesso', async () => {
      const mockPayment = {
        _id: 'payment123',
        save: jest.fn()
      };

      Payment.mockImplementation(() => mockPayment);

      paymentSimulationService.createPaymentIntent.mockResolvedValue({
        id: 'intent123',
        init_point: 'http://payment.url'
      });

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(rabbitMQService.publish).toHaveBeenCalled();
    });

    it('deve retornar erro 400 quando dados estiverem incompletos', async () => {
      req.body.items = [];

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Dados incompletos para criação do pagamento'
      });
    });
  });

  describe('getPayment', () => {
    it('deve retornar um pagamento existente', async () => {
      const mockPayment = {
        _id: 'payment123',
        orderId: 'order123',
        amount: 200
      };

      Payment.findById.mockResolvedValue(mockPayment);
      req.params.id = 'payment123';

      await getPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('deve retornar 404 quando pagamento não for encontrado', async () => {
      Payment.findById.mockResolvedValue(null);
      req.params.id = 'nonexistent';

      await getPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Pagamento não encontrado'
      });
    });
  });

  describe('webhook', () => {
    it('deve processar notificação de pagamento com sucesso', async () => {
      const mockPayment = {
        _id: 'payment123',
        orderId: 'order123',
        userId: 'user123',
        save: jest.fn()
      };

      const mockNotification = {
        metadata: {
          orderId: 'order123'
        },
        status: 'approved',
        paymentId: 'payment123',
        paymentMethod: 'credit_card'
      };

      req.body = mockNotification;
      Payment.findOne.mockResolvedValue(mockPayment);
      paymentSimulationService.processPaymentNotification.mockResolvedValue(mockNotification);

      await webhook(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(mockPayment.save).toHaveBeenCalled();
      expect(rabbitMQService.publish).toHaveBeenCalled();
    });
  });
}); 