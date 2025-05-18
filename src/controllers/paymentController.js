const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/payment');
const paymentSimulationService = require('../services/paymentSimulation');
const rabbitMQService = require('../services/rabbitMQ');
const notificationService = require('../services/notificationService');
const config = require('../config/config');
const logger = require('../utils/logger');
const hateoasUtils = require('../utils/hateoasUtils');

/**
 * Cria um novo pagamento
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.createPayment = async (req, res) => {
  try {
    const { userId, items, callbackUrl, payer } = req.body;
    
    if (!userId || !items || items.length === 0 || !payer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos para criação do pagamento' 
      });
    }

    const amount = items.reduce((total, item) => {
      return total + (item.unitPrice * item.quantity);
    }, 0);

    const orderId = uuidv4();
    
    const payment = new Payment({
      orderId,
      userId,
      amount,
      items: items.map(item => ({
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    });
    await payment.save();
    
    const paymentData = {
      orderId,
      userId,
      items,
      currency: 'BRL',
      payer,
      callbackUrl: callbackUrl || 'https://seu-site.com/checkout'
    };
    const paymentIntent = await paymentSimulationService.createPaymentIntent(paymentData);
    
    payment.paymentUrl = paymentIntent.init_point;
    payment.paymentId = paymentIntent.id;
    payment.updatedAt = new Date();
    await payment.save();
    
    await rabbitMQService.publish(
      config.rabbitmq.exchanges.payments,
      'payment.request',
      {
        action: 'PAYMENT_CREATED',
        paymentId: payment._id,
        orderId,
        userId,
        amount,
        paymentUrl: paymentIntent.init_point
      }
    );
    
    // Generate HATEOAS links for the response
    const links = hateoasUtils.generatePaymentLinks(payment._id, req);
    
    return res.status(201).json(
      hateoasUtils.createHateoasResponse(true, {
        paymentId: payment._id,
        orderId,
        amount,
        paymentUrl: paymentIntent.init_point
      }, links, null, req)
    );
  } catch (error) {
    logger.error(`Erro ao criar pagamento: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar pagamento',
      error: error.message
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
        message: 'Pagamento não encontrado'
      });
    }
    
    // Generate HATEOAS links for the response
    const links = hateoasUtils.generatePaymentLinks(payment._id, req);
    
    return res.status(200).json(
      hateoasUtils.createHateoasResponse(true, payment, links, null, req)
    );
  } catch (error) {
    logger.error(`Erro ao obter pagamento: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter pagamento',
      error: error.message
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
    
    // Respond quickly to the webhook with a 202 Accepted status - better RESTful practice
    // This acknowledges receipt but not processing completion
    res.status(202).json(
      hateoasUtils.createHateoasResponse(
        true, 
        null, 
        [
          {
            rel: 'payments',
            href: `${req.protocol}://${req.get('host')}/api/payments`,
            method: 'GET'
          }
        ],
        'Notificação recebida e será processada',
        req
      )
    );
    
    const paymentInfo = await paymentSimulationService.processPaymentNotification(notification);
    if (!paymentInfo) {
      logger.info('Notificação ignorada: não é um evento de pagamento');
      return;
    }
    
    const payment = await Payment.findOne({ 
      orderId: paymentInfo.metadata.orderId || paymentInfo.metadata.externalReference 
    });
    
    if (!payment) {
      logger.error(`Pagamento não encontrado para pedido: ${paymentInfo.metadata.orderId}`);
      return;
    }
    
    payment.status = paymentInfo.status;
    payment.paymentId = paymentInfo.paymentId;
    payment.paymentMethod = paymentInfo.paymentMethod;
    payment.updatedAt = new Date();
    await payment.save();
    
    // Enviar notificação ao usuário sobre o status do pagamento
    if (payment.status === 'approved' || payment.status === 'rejected') {
      await notificationService.sendPaymentNotification(
        payment.userId,
        payment.status,
        payment
      );
      logger.info(`Notificação de pagamento ${payment.status} enviada para usuário ${payment.userId}`);
    }
    
    await rabbitMQService.publish(
      config.rabbitmq.exchanges.payments,
      'payment.result',
      {
        action: 'PAYMENT_UPDATED',
        paymentId: payment._id,
        orderId: payment.orderId,
        userId: payment.userId,
        status: payment.status,
        amount: payment.amount
      }
    );
    
    logger.info(`Pagamento ${payment.orderId} atualizado para ${payment.status}`);
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
    // Get pagination parameters from middleware
    const { page, limit, offset } = req.pagination || { page: 1, limit: 10, offset: 0 };
    
    // Get total count of payments
    const totalItems = await Payment.countDocuments();
    
    // Get payments with pagination
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    
    // Get base URL for pagination links
    const baseUrl = `${req.protocol}://${req.get('host')}/api/payments`;
    
    // Generate pagination info using paginationUtils
    const paginationInfo = require('../utils/paginationUtils').getPaginationInfo({
      totalItems,
      page,
      limit,
      baseUrl
    });
    
    // Set pagination headers
    if (res.setPaginationHeaders) {
      res.setPaginationHeaders(paginationInfo);
    }
    
    // Add individual resource links
    const paymentsWithLinks = payments.map(payment => {
      const resourceLinks = hateoasUtils.generatePaymentLinks(payment._id, req);
      return {
        ...payment.toObject(),
        _links: resourceLinks
      };
    });
    
    // Combine pagination links with collection links
    const responseLinks = [
      ...Object.entries(paginationInfo._links).map(([rel, link]) => ({
        rel,
        href: link.href,
        method: 'GET'
      }))
    ];
    
    return res.status(200).json(
      hateoasUtils.createHateoasResponse(
        true,
        {
          payments: paymentsWithLinks,
          _meta: paginationInfo._meta
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
      message: 'Erro ao listar pagamentos',
      error: error.message
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
        message: 'Pagamento não encontrado'
      });
    }
    
    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Não é possível cancelar um pagamento com status '${payment.status}'`
      });
    }
    
    // Simulate payment cancellation
    const result = await paymentSimulationService.cancelPayment(payment.paymentId);
    
    payment.status = 'cancelled';
    payment.updatedAt = new Date();
    await payment.save();
    
    // Generate HATEOAS links for the response
    const links = hateoasUtils.generatePaymentLinks(payment._id, req);
    
    await rabbitMQService.publish(
      config.rabbitmq.exchanges.payments,
      'payment.status',
      {
        action: 'PAYMENT_CANCELLED',
        paymentId: payment._id,
        orderId: payment.orderId,
        userId: payment.userId
      }
    );
    
    return res.status(200).json(
      hateoasUtils.createHateoasResponse(
        true,
        {
          paymentId: payment._id,
          orderId: payment.orderId,
          status: payment.status
        },
        links,
        'Pagamento cancelado com sucesso',
        req
      )
    );
  } catch (error) {
    logger.error(`Erro ao cancelar pagamento: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao cancelar pagamento',
      error: error.message
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
        message: 'Pagamento não encontrado'
      });
    }
    
    if (payment.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Não é possível reembolsar um pagamento com status '${payment.status}'`
      });
    }
    
    // Simulate payment refund
    const result = await paymentSimulationService.refundPayment(payment.paymentId);
    
    payment.status = 'refunded';
    payment.updatedAt = new Date();
    await payment.save();
    
    // Generate HATEOAS links for the response
    const links = hateoasUtils.generatePaymentLinks(payment._id, req);
    
    await rabbitMQService.publish(
      config.rabbitmq.exchanges.payments,
      'payment.status',
      {
        action: 'PAYMENT_REFUNDED',
        paymentId: payment._id,
        orderId: payment.orderId,
        userId: payment.userId
      }
    );
    
    return res.status(200).json(
      hateoasUtils.createHateoasResponse(
        true,
        {
          paymentId: payment._id,
          orderId: payment.orderId,
          status: payment.status
        },
        links,
        'Pagamento reembolsado com sucesso',
        req
      )
    );
  } catch (error) {
    logger.error(`Erro ao reembolsar pagamento: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao reembolsar pagamento',
      error: error.message
    });
  }
};