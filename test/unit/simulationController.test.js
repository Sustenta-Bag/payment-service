const simulationController = require('../../src/controllers/simulationController');
const Payment = require('../../src/models/payment');
const paymentSimulationService = require('../../src/services/paymentSimulation');
const rabbitMQService = require('../../src/services/rabbitMQ');
const notificationService = require('../../src/services/notificationService');

jest.mock('../../src/models/payment');
jest.mock('../../src/services/paymentSimulation');
jest.mock('../../src/services/rabbitMQ');
jest.mock('../../src/services/notificationService');

describe('SimulationController', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, query: {}, body: {}, protocol: 'http', get: jest.fn().mockReturnValue('localhost:3000') };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn(), set: jest.fn(), setHeader: jest.fn() };
    jest.clearAllMocks();
  });

  describe('renderPaymentSimulation', () => {
    it('deve retornar 400 se orderId não for fornecido', async () => {
      req.query = {};
      await simulationController.renderPaymentSimulation(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });
    it('deve retornar 404 se pagamento não encontrado', async () => {
      req.query = { orderId: 'order1' };
      Payment.findOne.mockResolvedValue(null);
      await simulationController.renderPaymentSimulation(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });
    it('deve renderizar HTML se pagamento encontrado', async () => {
      req.query = { orderId: 'order1' };
      Payment.findOne.mockResolvedValue({ orderId: 'order1' });
      const html = '<html>Simulação</html>';
      jest.spyOn(require('../../src/utils/templates'), 'renderPaymentSimulationPage').mockReturnValue(html);
      await simulationController.renderPaymentSimulation(req, res);
      const setCalled = res.set.mock.calls.some(call => call[0] === 'Content-Type' && call[1] === 'text/html');
      const setHeaderCalled = res.setHeader.mock.calls.some(call => call[0] === 'Content-Type' && call[1] === 'text/html');
      expect(setCalled || setHeaderCalled).toBe(true);
      expect(res.send).toHaveBeenCalledWith(html);
    });
  });

  describe('processPaymentSimulation', () => {
    it('deve retornar 400 se faltar dados', async () => {
      req.body = {};
      await simulationController.processPaymentSimulation(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });
    it('deve retornar 404 se pagamento não encontrado', async () => {
      req.body = { orderId: 'order1', action: 'approve' };
      Payment.findOne.mockResolvedValue(null);
      await simulationController.processPaymentSimulation(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });
    it('deve retornar 400 para ação inválida', async () => {
      req.body = { orderId: 'order1', action: 'invalid' };
      Payment.findOne.mockResolvedValue({ orderId: 'order1' });
      await simulationController.processPaymentSimulation(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });
    it('deve aprovar pagamento', async () => {
      req.body = { orderId: 'order1', action: 'approve' };
      const payment = { orderId: 'order1', save: jest.fn(), userId: 'user1', _id: 'id1', amount: 100 };
      Payment.findOne.mockResolvedValue(payment);
      paymentSimulationService.approvePayment.mockResolvedValue({ status: 'approved', paymentMethod: 'sim', paymentId: 'pid', metadata: { orderId: 'order1' } });
      rabbitMQService.publish.mockResolvedValue(true);
      notificationService.sendPaymentNotification.mockResolvedValue(true);
      await simulationController.processPaymentSimulation(req, res);
      expect(payment.save).toHaveBeenCalled();
      expect(notificationService.sendPaymentNotification).toHaveBeenCalled();
      expect(rabbitMQService.publish).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    it('deve rejeitar pagamento', async () => {
      req.body = { orderId: 'order1', action: 'reject' };
      const payment = { orderId: 'order1', save: jest.fn(), userId: 'user1', _id: 'id1', amount: 100 };
      Payment.findOne.mockResolvedValue(payment);
      paymentSimulationService.rejectPayment.mockResolvedValue({ status: 'rejected', paymentMethod: 'sim', paymentId: 'pid', metadata: { orderId: 'order1' } });
      rabbitMQService.publish.mockResolvedValue(true);
      notificationService.sendPaymentNotification.mockResolvedValue(true);
      await simulationController.processPaymentSimulation(req, res);
      expect(payment.save).toHaveBeenCalled();
      expect(notificationService.sendPaymentNotification).toHaveBeenCalled();
      expect(rabbitMQService.publish).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    it('deve processar pagamento pendente', async () => {
      req.body = { orderId: 'order1', action: 'pending' };
      const payment = { orderId: 'order1', save: jest.fn(), userId: 'user1', _id: 'id1', amount: 100 };
      Payment.findOne.mockResolvedValue(payment);
      rabbitMQService.publish.mockResolvedValue(true);
      await simulationController.processPaymentSimulation(req, res);
      expect(payment.save).toHaveBeenCalled();
      expect(rabbitMQService.publish).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getSimulatedPaymentStatus', () => {
    it('deve retornar 400 se orderId não for fornecido', async () => {
      req.params = {};
      await simulationController.getSimulatedPaymentStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });
    it('deve retornar 404 se pagamento não encontrado', async () => {
      req.params = { orderId: 'order1' };
      Payment.findOne.mockResolvedValue(null);
      await simulationController.getSimulatedPaymentStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });
    it('deve retornar status do pagamento', async () => {
      req.params = { orderId: 'order1' };
      Payment.findOne.mockResolvedValue({ _id: 'id1', orderId: 'order1', status: 'approved', amount: 100, createdAt: new Date() });
      await simulationController.getSimulatedPaymentStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });
}); 