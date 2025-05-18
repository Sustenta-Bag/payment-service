const Payment = require('../models/payment');
const paymentSimulationService = require('../services/paymentSimulation');
const rabbitMQService = require('../services/rabbitMQ');
const notificationService = require('../services/notificationService');
const config = require('../config/config');
const logger = require('../utils/logger');
const { renderPaymentSimulationPage } = require('../utils/templates');

/**
 * Renderiza a página de simulação de pagamento
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.renderPaymentSimulation = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderId, amount } = req.query;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'ID do pedido não fornecido'
      });
    }

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento não encontrado'
      });
    }    // Renderiza a página HTML de simulação de pagamento
    const html = renderPaymentSimulationPage(payment);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline' 'self'");
    return res.send(html);
  } catch (error) {
    logger.error(`Erro ao renderizar simulação: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar simulação de pagamento',
      error: error.message
    });
  }
};

/**
 * Processa uma simulação de pagamento
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.processPaymentSimulation = async (req, res) => {
  try {
    const { orderId, action } = req.body;
    
    if (!orderId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos para processar simulação'
      });
    }

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento não encontrado'
      });
    }

    let paymentResult;
    
    // Processa a ação de pagamento
    switch (action) {
      case 'approve':
        paymentResult = await paymentSimulationService.approvePayment(orderId);
        break;
      case 'reject':
        paymentResult = await paymentSimulationService.rejectPayment(orderId);
        break;
      case 'pending':
        paymentResult = {
          paymentId: payment.paymentId || 'sim_' + Date.now(),
          status: 'pending',
          paymentMethod: 'simulation',
          metadata: { orderId }
        };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Ação de pagamento inválida'
        });
    }    // Atualiza o pagamento no banco de dados
    payment.status = paymentResult.status;
    payment.paymentMethod = paymentResult.paymentMethod;
    payment.updatedAt = new Date();
    await payment.save();
    
    console.log('Pagamento atualizado:', payment);
    // Envia notificação se o pagamento foi aprovado ou rejeitado
    if (paymentResult.status === 'approved' || paymentResult.status === 'rejected') {
      await notificationService.sendPaymentNotification(
        payment.userId,
        paymentResult.status,
        payment
      );
      logger.info(`Notificação de pagamento ${paymentResult.status} enviada para o usuário ${payment.userId}`);
    }
    
    // Publica evento de atualização de pagamento
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
    
    logger.info(`Pagamento ${payment.orderId} processado com simulação: ${payment.status}`);
    
    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        orderId: payment.orderId,
        status: payment.status,
        message: `Pagamento ${paymentResult.status}`
      }
    });
  } catch (error) {
    logger.error(`Erro ao processar simulação: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar simulação de pagamento',
      error: error.message
    });
  }
};

/**
 * Obtém o status de um pagamento simulado
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.getSimulatedPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'ID do pedido não fornecido'
      });
    }

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento não encontrado'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        orderId: payment.orderId,
        status: payment.status,
        amount: payment.amount,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt || payment.createdAt
      }
    });
  } catch (error) {
    logger.error(`Erro ao obter status do pagamento simulado: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter status do pagamento',
      error: error.message
    });
  }
};
