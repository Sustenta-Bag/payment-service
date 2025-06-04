const {
  createPayment,
  getPayment,
  webhook,
} = require("../../src/controllers/paymentController");
const Payment = require("../../src/models/payment");
const paymentSimulationService = require("../../src/services/paymentSimulation");
const rabbitMQService = require("../../src/services/rabbitMQ");
const notificationService = require("../../src/services/notificationService");
const hateoasUtils = require("../../src/utils/hateoasUtils");
const paymentController = require("../../src/controllers/paymentController");

// Mock dos serviços
jest.mock("../../src/services/paymentSimulation");
jest.mock("../../src/services/rabbitMQ");
jest.mock("../../src/services/notificationService");
jest.mock("../../src/models/payment");
jest.mock("../../src/utils/hateoasUtils");

// Mock do logger para não poluir o output
jest.mock("../../src/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe("PaymentController", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        userId: "user123",
        orderId: "order123",
        items: [
          {
            title: "Produto 1",
            description: "Descrição do produto 1",
            quantity: 2,
            unitPrice: 100,
          },
        ],
        payer: {
          name: "João Silva",
          email: "joao@email.com",
        },
      },
      params: {},
      protocol: "http",
      get: jest.fn().mockReturnValue("localhost:3000"),
      pagination: { page: 1, limit: 10, offset: 0 },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      set: jest.fn(),
      setHeader: jest.fn(),
    };

    // Reset dos mocks
    jest.clearAllMocks();
  });

  describe("createPayment", () => {
    it("deve criar um novo pagamento com sucesso", async () => {
      const mockPayment = {
        _id: "payment123",
        save: jest.fn(),
      };

      Payment.mockImplementation(() => mockPayment);

      paymentSimulationService.createPaymentIntent.mockResolvedValue({
        id: "intent123",
        init_point: "http://payment.url",
      });

      hateoasUtils.generatePaymentLinks.mockReturnValue([]);
      hateoasUtils.createHateoasResponse.mockReturnValue({});
      rabbitMQService.publish.mockResolvedValue(true);

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando dados estiverem incompletos", async () => {
      req.body.items = [];

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          "Dados incompletos para criação do pagamento. userId, orderId, items e payer são obrigatórios",
      });
    });
    it("deve tratar erro interno", async () => {
      req.body = {
        userId: "user1",
        orderId: "order1",
        items: [
          { title: "item", description: "desc", quantity: 1, unitPrice: 10 },
        ],
        payer: { name: "payer" },
      };
      Payment.mockImplementation(() => {
        throw new Error("fail");
      });
      await createPayment(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getPayment", () => {
    it("deve retornar um pagamento existente", async () => {
      const mockPayment = {
        _id: "payment123",
        orderId: "order123",
        amount: 200,
      };

      Payment.findById.mockResolvedValue(mockPayment);
      req.params.id = "payment123";

      hateoasUtils.generatePaymentLinks.mockReturnValue([]);
      hateoasUtils.createHateoasResponse.mockReturnValue({});

      await getPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it("deve retornar 404 quando pagamento não for encontrado", async () => {
      Payment.findById.mockResolvedValue(null);
      req.params.id = "nonexistent";

      await getPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Pagamento não encontrado",
      });
    });

    it("deve tratar erro interno", async () => {
      req.params = { id: "id1" };
      Payment.findById = jest.fn().mockRejectedValue(new Error("fail"));
      await getPayment(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("webhook", () => {
    it("deve processar notificação de pagamento com sucesso", async () => {
      const mockPayment = {
        _id: "payment123",
        orderId: "order123",
        userId: "user123",
        save: jest.fn(),
      };

      const mockNotification = {
        metadata: {
          orderId: "order123",
        },
        status: "approved",
        paymentId: "payment123",
        paymentMethod: "credit_card",
      };

      req.body = mockNotification;
      Payment.findOne.mockResolvedValue(mockPayment);
      paymentSimulationService.processPaymentNotification.mockResolvedValue(
        mockNotification
      );

      await webhook(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(mockPayment.save).toHaveBeenCalled();
      expect(rabbitMQService.publish).toHaveBeenCalled();
    });
  });

  describe("listPayments", () => {
    it("deve retornar lista de pagamentos", async () => {
      Payment.countDocuments = jest.fn().mockResolvedValue(1);
      Payment.find = jest
        .fn()
        .mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest
            .fn()
            .mockResolvedValue([{ _id: "id1", toObject: () => ({}) }]),
        });
      hateoasUtils.generatePaymentLinks.mockReturnValue([]);
      hateoasUtils.createHateoasResponse.mockReturnValue({});
      require("../../src/utils/paginationUtils").getPaginationInfo = jest
        .fn()
        .mockReturnValue({ _meta: {}, _links: {} });
      res.setPaginationHeaders = jest.fn();
      await paymentController.listPayments(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    it("deve tratar erro interno", async () => {
      Payment.countDocuments = jest.fn().mockRejectedValue(new Error("fail"));
      await paymentController.listPayments(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("cancelPayment", () => {
    it("deve retornar 404 se pagamento não encontrado", async () => {
      req.params = { id: "id1" };
      Payment.findById = jest.fn().mockResolvedValue(null);
      await paymentController.cancelPayment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });
    it("deve retornar 400 se status não for pending", async () => {
      req.params = { id: "id1" };
      Payment.findById = jest.fn().mockResolvedValue({ status: "approved" });
      await paymentController.cancelPayment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });
    it("deve cancelar pagamento com sucesso", async () => {
      req.params = { id: "id1" };
      const payment = {
        _id: "id1",
        orderId: "order1",
        userId: "user1",
        status: "pending",
        save: jest.fn(),
      };
      Payment.findById = jest.fn().mockResolvedValue(payment);
      paymentSimulationService.cancelPayment = jest.fn().mockResolvedValue({});
      hateoasUtils.generatePaymentLinks.mockReturnValue([]);
      hateoasUtils.createHateoasResponse.mockReturnValue({});
      rabbitMQService.publish.mockResolvedValue(true);
      await paymentController.cancelPayment(req, res);
      expect(payment.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    it("deve tratar erro interno", async () => {
      req.params = { id: "id1" };
      Payment.findById = jest.fn().mockRejectedValue(new Error("fail"));
      await paymentController.cancelPayment(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("refundPayment", () => {
    it("deve retornar 404 se pagamento não encontrado", async () => {
      req.params = { id: "id1" };
      Payment.findById = jest.fn().mockResolvedValue(null);
      await paymentController.refundPayment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });
    it("deve retornar 400 se status não for approved", async () => {
      req.params = { id: "id1" };
      Payment.findById = jest.fn().mockResolvedValue({ status: "pending" });
      await paymentController.refundPayment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });
    it("deve reembolsar pagamento com sucesso", async () => {
      req.params = { id: "id1" };
      const payment = {
        _id: "id1",
        orderId: "order1",
        userId: "user1",
        status: "approved",
        save: jest.fn(),
      };
      Payment.findById = jest.fn().mockResolvedValue(payment);
      paymentSimulationService.refundPayment = jest.fn().mockResolvedValue({});
      hateoasUtils.generatePaymentLinks.mockReturnValue([]);
      hateoasUtils.createHateoasResponse.mockReturnValue({});
      rabbitMQService.publish.mockResolvedValue(true);
      await paymentController.refundPayment(req, res);
      expect(payment.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    it("deve tratar erro interno", async () => {
      req.params = { id: "id1" };
      Payment.findById = jest.fn().mockRejectedValue(new Error("fail"));
      await paymentController.refundPayment(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
