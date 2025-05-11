const Payment = require('../models/payment');
const rabbitMQService = require('../services/rabbitMQ');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Simula uma atualização de pagamento
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.simulatePayment = async (req, res) => {
  try {
    const { orderId, status = 'approved' } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'O orderId é obrigatório' 
      });
    }
    
    // Busca o pagamento pelo orderId
    const payment = await Payment.findOne({ orderId });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `Pagamento com orderId ${orderId} não encontrado`
      });
    }
    
    // Atualiza o status do pagamento
    payment.status = status;
    payment.updatedAt = new Date();
    await payment.save();
    
    // Publica mensagem com resultado do pagamento
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
    
    logger.info(`Simulação: Pagamento ${payment.orderId} atualizado para ${payment.status}`);
    
    return res.status(200).json({
      success: true,
      message: `Status do pagamento atualizado para ${status}`,
      data: {
        paymentId: payment._id,
        orderId: payment.orderId,
        status: payment.status
      }
    });
  } catch (error) {
    logger.error(`Erro ao simular pagamento: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao simular pagamento',
      error: error.message
    });
  }
};

/**
 * Fornece uma lista de pagamentos para teste
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.listPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(10);
    
    return res.status(200).json({
      success: true,
      data: payments.map(p => ({
        id: p._id,
        orderId: p.orderId,
        status: p.status,
        amount: p.amount,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    logger.error(`Erro ao listar pagamentos: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar pagamentos',
      error: error.message
    });
  }
};
