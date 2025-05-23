const testController = require('../../src/controllers/testController');
const Payment = require('../../src/models/payment');
const rabbitMQService = require('../../src/services/rabbitMQ');
const config = require('../../src/config/config');

jest.mock('../../src/models/payment');
jest.mock('../../src/services/rabbitMQ');

// Mock do logger para não poluir o output
jest.mock('../../src/utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }));

describe('TestController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('simulatePayment', () => {
    it('deve retornar 400 se orderId não for fornecido', async () => {
      req.body = { fcmToken: 'token' };
      await testController.simulatePayment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
    it('deve retornar 400 se fcmToken não for fornecido', async () => {
      req.body = { orderId: 'order1' };
      await testController.simulatePayment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
    it('deve retornar 404 se pagamento não encontrado', async () => {
      req.body = { orderId: 'order1', fcmToken: 'token' };
      Payment.findOne.mockResolvedValue(null);
      await testController.simulatePayment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
    it('deve simular pagamento e enviar notificação', async () => {
      req.body = { orderId: 'order1', fcmToken: 'token', status: 'approved' };
      const payment = { _id: 'id1', orderId: 'order1', userId: 'user1', amount: 100, save: jest.fn(), updatedAt: new Date() };
      Payment.findOne.mockResolvedValue(payment);
      rabbitMQService.publish.mockResolvedValue(true);
      await testController.simulatePayment(req, res);
      expect(payment.save).toHaveBeenCalled();
      expect(rabbitMQService.publish).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    it('deve tratar erro interno', async () => {
      req.body = { orderId: 'order1', fcmToken: 'token', status: 'approved' };
      Payment.findOne.mockRejectedValue(new Error('DB error'));
      await testController.simulatePayment(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('listPayments', () => {
    it('deve retornar lista de pagamentos', async () => {
      const payments = [
        { _id: 'id1', orderId: 'order1', status: 'approved', amount: 100, createdAt: new Date() },
        { _id: 'id2', orderId: 'order2', status: 'pending', amount: 200, createdAt: new Date() }
      ];
      Payment.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue(payments) });
      await testController.listPayments(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Array) }));
    });
    it('deve tratar erro interno', async () => {
      Payment.find.mockImplementation(() => ({ sort: () => ({ limit: () => { throw new Error('DB error'); } }) }));
      await testController.listPayments(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });
}); 