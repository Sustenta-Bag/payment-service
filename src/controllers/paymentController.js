const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/payment');
const paymentSimulationService = require('../services/paymentSimulation');
const rabbitMQService = require('../services/rabbitMQ');
const notificationService = require('../services/notificationService');
const config = require('../config/config');
const logger = require('../utils/logger');

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
    
    return res.status(201).json({
      success: true,
      data: {
        paymentId: payment._id,
        orderId,
        amount,
        paymentUrl: paymentIntent.init_point
      }
    });
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
    
    return res.status(200).json({
      success: true,
      data: payment
    });
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
    
    res.status(200).send('OK');
    
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