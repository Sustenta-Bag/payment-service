const { v4: uuidv4 } = require("uuid");
const Payment = require("../models/payment");
const paymentSimulationService = require("../services/paymentSimulation");
const rabbitMQService = require("../services/rabbitMQ");
const config = require("../config/config");
const logger = require("../utils/logger");
const hateoasUtils = require("../utils/hateoasUtils");

/**
 * Cria um novo pagamento
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.createPayment = async (req, res) => {
  try {
    logger.info("📥 Recebendo requisição de criação de pagamento");
    logger.info("📋 Body da requisição:", JSON.stringify(req.body, null, 2));

    const { userId, orderId, items, callbackUrl, payer, authToken } = req.body;

    logger.info(
      `🔍 Validando dados: userId=${userId}, orderId=${orderId}, items=${
        items?.length
      }, payer=${payer ? "sim" : "não"}`
    );

    if (!userId || !orderId || !items || items.length === 0 || !payer) {
      logger.error("❌ Validação falhou - dados incompletos");
      logger.error(
        `❌ Detalhes: userId=${userId}, orderId=${orderId}, items=${items}, itemsLength=${items?.length}, payer=${payer}`
      );
      return res.status(400).json({
        success: false,
        message:
          "Dados incompletos para criação do pagamento. userId, orderId, items e payer são obrigatórios",
      });
    }

    const amount = items.reduce((total, item) => {
      return total + item.unitPrice * item.quantity;
    }, 0);
    const payment = new Payment({
      orderId,
      userId,
      authToken,
      amount,
      items: items.map((item) => ({
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
    await payment.save();

    const paymentData = {
      orderId,
      userId,
      items,
      currency: "BRL",
      payer,
      callbackUrl: callbackUrl || "https://seu-site.com/checkout",
    };
    const paymentIntent = await paymentSimulationService.createPaymentIntent(
      paymentData
    );

    payment.paymentUrl = paymentIntent.init_point;
    payment.paymentId = paymentIntent.id;
    payment.updatedAt = new Date();
    await payment.save();

    await rabbitMQService.publish(
      config.rabbitmq.exchanges.payments,
      "payment.request",
      {
        action: "PAYMENT_CREATED",
        paymentId: payment._id,
        orderId,
        userId,
        amount,
        paymentUrl: paymentIntent.init_point,
      }
    );

    const links = hateoasUtils.generatePaymentLinks(payment._id, req);

    return res.status(201).json(
      hateoasUtils.createHateoasResponse(
        true,
        {
          paymentId: payment._id,
          orderId,
          amount,
          paymentUrl: paymentIntent.init_point,
        },
        links,
        null,
        req
      )
    );
  } catch (error) {
    logger.error(`Erro ao criar pagamento: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Erro ao processar pagamento",
      error: error.message,
    });
  }
};

/**
 * Obtém informações de um pagamento
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.getPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Pagamento não encontrado",
      });
    }

    const links = hateoasUtils.generatePaymentLinks(payment._id, req);

    return res
      .status(200)
      .json(
        hateoasUtils.createHateoasResponse(true, payment, links, null, req)
      );
  } catch (error) {
    logger.error(`Erro ao obter pagamento: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Erro ao obter pagamento",
      error: error.message,
    });
  }
};

/**
 * Obtém informações de um pagamento por Order ID
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Pagamento não encontrado para este orderId",
      });
    }
    const links = hateoasUtils.generatePaymentLinks(payment._id, req);

    return res
      .status(200)
      .json(
        hateoasUtils.createHateoasResponse(true, payment, links, null, req)
      );
  } catch (error) {
    logger.error(`Erro ao obter pagamento por orderId: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Erro ao obter pagamento por orderId",
      error: error.message,
    });
  }
};

/**
 * Recebe notificações simuladas de pagamento
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.webhook = async (req, res) => {
  try {
    const notification = req.body;

    res.status(202).json(
      hateoasUtils.createHateoasResponse(
        true,
        null,
        [
          {
            rel: "payments",
            href: `${req.protocol}://${req.get("host")}/api/payments`,
            method: "GET",
          },
        ],
        "Notificação recebida e será processada",
        req
      )
    );

    const paymentInfo =
      await paymentSimulationService.processPaymentNotification(notification);
    if (!paymentInfo) {
      logger.info("Notificação ignorada: não é um evento de pagamento");
      return;
    }

    const payment = await Payment.findOne({
      orderId:
        paymentInfo.metadata.orderId || paymentInfo.metadata.externalReference,
    });

    if (!payment) {
      logger.error(
        `Pagamento não encontrado para pedido: ${paymentInfo.metadata.orderId}`
      );
      return;
    }
    const previousStatus = payment.status;
    payment.status = paymentInfo.status;
    payment.paymentId = paymentInfo.paymentId;
    payment.paymentMethod = paymentInfo.paymentMethod;
    payment.updatedAt = new Date();
    await payment.save();

    await rabbitMQService.publish(
      config.rabbitmq.exchanges.payments,
      "payment.result",
      {
        action: "PAYMENT_UPDATED",
        paymentId: payment._id,
        orderId: payment.orderId,
        userId: payment.userId,
        status: payment.status,
        previousStatus: previousStatus,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        items: payment.items,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        shouldNotifyUser:
          payment.status === "approved" || payment.status === "rejected",
        notificationData: {
          userEmail: payment.payer?.email,
          userName: payment.payer?.name,
          paymentUrl: payment.paymentUrl,
        },
      }
    );

    logger.info(
      `Pagamento ${payment.orderId} atualizado para ${payment.status}`
    );
  } catch (error) {
    logger.error(`Erro ao processar webhook: ${error.message}`);
  }
};

/**
 * Lista todos os pagamentos com paginação
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.listPayments = async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination || {
      page: 1,
      limit: 10,
      offset: 0,
    };

    const totalItems = await Payment.countDocuments();

    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const baseUrl = `${req.protocol}://${req.get("host")}/api/payments`;

    const paginationInfo =
      require("../utils/paginationUtils").getPaginationInfo({
        totalItems,
        page,
        limit,
        baseUrl,
      });

    if (res.setPaginationHeaders) {
      res.setPaginationHeaders(paginationInfo);
    }

    const paymentsWithLinks = payments.map((payment) => {
      const resourceLinks = hateoasUtils.generatePaymentLinks(payment._id, req);
      return {
        ...payment.toObject(),
        _links: resourceLinks,
      };
    });

    const responseLinks = [
      ...Object.entries(paginationInfo._links).map(([rel, link]) => ({
        rel,
        href: link.href,
        method: "GET",
      })),
    ];

    return res.status(200).json(
      hateoasUtils.createHateoasResponse(
        true,
        {
          payments: paymentsWithLinks,
          _meta: paginationInfo._meta,
        },
        responseLinks,
        null,
        req
      )
    );
  } catch (error) {
    logger.error(`Erro ao listar pagamentos: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Erro ao listar pagamentos",
      error: error.message,
    });
  }
};

/**
 * Cancela um pagamento
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.cancelPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Pagamento não encontrado",
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Não é possível cancelar um pagamento com status '${payment.status}'`,
      });
    }

    const result = await paymentSimulationService.cancelPayment(
      payment.paymentId
    );

    payment.status = "cancelled";
    payment.updatedAt = new Date();
    await payment.save();

    const links = hateoasUtils.generatePaymentLinks(payment._id, req);

    await rabbitMQService.publish(
      config.rabbitmq.exchanges.payments,
      "payment.status",
      {
        action: "PAYMENT_CANCELLED",
        paymentId: payment._id,
        orderId: payment.orderId,
        userId: payment.userId,
      }
    );

    return res.status(200).json(
      hateoasUtils.createHateoasResponse(
        true,
        {
          paymentId: payment._id,
          orderId: payment.orderId,
          status: payment.status,
        },
        links,
        "Pagamento cancelado com sucesso",
        req
      )
    );
  } catch (error) {
    logger.error(`Erro ao cancelar pagamento: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Erro ao cancelar pagamento",
      error: error.message,
    });
  }
};

/**
 * Reembolsa um pagamento
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.refundPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Pagamento não encontrado",
      });
    }

    if (payment.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: `Não é possível reembolsar um pagamento com status '${payment.status}'`,
      });
    }

    const result = await paymentSimulationService.refundPayment(
      payment.paymentId
    );

    payment.status = "refunded";
    payment.updatedAt = new Date();
    await payment.save();

    const links = hateoasUtils.generatePaymentLinks(payment._id, req);

    await rabbitMQService.publish(
      config.rabbitmq.exchanges.payments,
      "payment.status",
      {
        action: "PAYMENT_REFUNDED",
        paymentId: payment._id,
        orderId: payment.orderId,
        userId: payment.userId,
      }
    );

    return res.status(200).json(
      hateoasUtils.createHateoasResponse(
        true,
        {
          paymentId: payment._id,
          orderId: payment.orderId,
          status: payment.status,
        },
        links,
        "Pagamento reembolsado com sucesso",
        req
      )
    );
  } catch (error) {
    logger.error(`Erro ao reembolsar pagamento: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Erro ao reembolsar pagamento",
      error: error.message,
    });
  }
};

/**
 * Obtém todos os pagamentos de um usuário com filtros opcionais
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.getPaymentsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, startDate, endDate } = req.query;
    const { page, limit, offset } = req.pagination;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId é obrigatório",
      });
    }

    const filter = { userId };

    if (status) {
      const validStatuses = [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "refunded",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status inválido. Valores aceitos: ${validStatuses.join(
            ", "
          )}`,
        });
      }
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Data inicial inválida. Use o formato YYYY-MM-DD",
          });
        }
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Data final inválida. Use o formato YYYY-MM-DD",
          });
        }
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit),
      Payment.countDocuments(filter),
    ]);

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Nenhum pagamento encontrado para este usuário",
      });
    }

    const paymentsWithLinks = payments.map((payment) => {
      const paymentLinks = hateoasUtils.generatePaymentLinks(
        {
          paymentId: payment._id,
          orderId: payment.orderId,
          userId: payment.userId,
          status: payment.status,
        },
        req
      );

      return hateoasUtils.createHateoasResponse(
        true,
        {
          paymentId: payment._id,
          orderId: payment.orderId,
          userId: payment.userId,
          status: payment.status,
          amount: payment.amount,
          items: payment.items,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          paymentUrl: payment.paymentUrl,
        },
        paymentLinks,
        "Dados do pagamento",
        req
      );
    });

    const totalPages = Math.ceil(total / limit);
    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    const statusStats = await Payment.aggregate([
      { $match: { userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const stats = statusStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}${
      req.path
    }`;
    const paginationLinks = [];

    if (pagination.hasPrev) {
      paginationLinks.push({
        rel: "prev",
        href: `${baseUrl}?page=${page - 1}&limit=${limit}${
          status ? `&status=${status}` : ""
        }${startDate ? `&startDate=${startDate}` : ""}${
          endDate ? `&endDate=${endDate}` : ""
        }`,
        method: "GET",
        description: "Página anterior",
      });
    }

    if (pagination.hasNext) {
      paginationLinks.push({
        rel: "next",
        href: `${baseUrl}?page=${page + 1}&limit=${limit}${
          status ? `&status=${status}` : ""
        }${startDate ? `&startDate=${startDate}` : ""}${
          endDate ? `&endDate=${endDate}` : ""
        }`,
        method: "GET",
        description: "Próxima página",
      });
    }

    const statusLinks = [
      { status: "pending", description: "Pagamentos pendentes" },
      { status: "approved", description: "Pagamentos aprovados" },
      { status: "rejected", description: "Pagamentos rejeitados" },
      { status: "cancelled", description: "Pagamentos cancelados" },
      { status: "refunded", description: "Pagamentos reembolsados" },
    ].map((item) => ({
      rel: `filter-${item.status}`,
      href: `${baseUrl}?status=${item.status}&page=1&limit=${limit}`,
      method: "GET",
      description: item.description,
    }));

    const allLinks = [
      {
        rel: "self",
        href: `${baseUrl}?page=${page}&limit=${limit}${
          status ? `&status=${status}` : ""
        }${startDate ? `&startDate=${startDate}` : ""}${
          endDate ? `&endDate=${endDate}` : ""
        }`,
        method: "GET",
        description: "Esta página",
      },
      {
        rel: "all-payments",
        href: `${baseUrl}?page=1&limit=${limit}`,
        method: "GET",
        description: "Todos os pagamentos do usuário",
      },
      ...paginationLinks,
      ...statusLinks,
    ];

    logger.info(
      `Pagamentos do usuário ${userId} recuperados: ${payments.length} de ${total} total`
    );

    return res.status(200).json(
      hateoasUtils.createHateoasResponse(
        true,
        paymentsWithLinks,
        allLinks,
        `${payments.length} pagamentos encontrados para o usuário`,
        req,
        {
          pagination,
          stats,
          filters: {
            status: status || "all",
            startDate: startDate || null,
            endDate: endDate || null,
          },
        }
      )
    );
  } catch (error) {
    logger.error(`Erro ao buscar pagamentos do usuário: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar pagamentos do usuário",
      error: error.message,
    });
  }
};
