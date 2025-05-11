const Payment = require('../models/payment');
const rabbitMQService = require('../services/rabbitMQ');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Gera mensagem de notificação com base no status do pagamento
 * @param {Object} payment Objeto do pagamento
 * @param {String} status Status do pagamento
 * @returns {Object} Objeto com título e corpo da notificação
 */
function getNotificationMessage(payment, status) {
  const formatCurrency = (value) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };
  
  const amount = formatCurrency(payment.amount);
  
  switch (status) {
    case 'approved':
      return {
        title: 'Pagamento aprovado!',
        body: `Seu pagamento de ${amount} foi aprovado com sucesso.`
      };
    case 'pending':
      return {
        title: 'Pagamento em processamento',
        body: `Seu pagamento de ${amount} está sendo processado.`
      };
    case 'rejected':
      return {
        title: 'Pagamento recusado',
        body: `Seu pagamento de ${amount} foi recusado. Entre em contato com seu banco.`
      };
    case 'refunded':
      return {
        title: 'Pagamento reembolsado',
        body: `Seu pagamento de ${amount} foi reembolsado.`
      };
    default:
      return {
        title: 'Atualização de pagamento',
        body: `O status do seu pagamento de ${amount} foi atualizado para: ${status}`
      };
  }
}

/**
 * Simula uma atualização de pagamento
 * @param {Object} req Request
 * @param {Object} res Response
 * @returns {Promise<void>}
 */
exports.simulatePayment = async (req, res) => {
  try {
    const { orderId, status = 'approved', fcmToken } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'O orderId é obrigatório' 
      });
    }
    
    if (!fcmToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'O fcmToken é obrigatório para enviar notificações' 
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
      // Envia notificação para o serviço de notificação
    try {
      const notificationMessage = getNotificationMessage(payment, status);
      
      await rabbitMQService.publish(
        config.rabbitmq.exchanges.notifications, // Exchange do serviço de notificação
        'notification', // Routing key do serviço de notificação
        {
          to: fcmToken, // Token FCM do dispositivo
          notification: {
            title: notificationMessage.title,
            body: notificationMessage.body
          },
          data: {
            type: 'single',
            payload: {
              orderId: payment.orderId,
              paymentId: payment._id.toString(),
              status: payment.status,
              amount: payment.amount.toString()
            }
          }
        }
      );
      
      logger.info(`Notificação enviada para o token FCM: ${fcmToken.substring(0, 10)}...`);
    } catch (notificationError) {
      logger.error(`Erro ao enviar notificação: ${notificationError.message}`);
      // Não falha o processo principal se a notificação falhar
    }
    
    logger.info(`Simulação: Pagamento ${payment.orderId} atualizado para ${payment.status}`);
    
    return res.status(200).json({
      success: true,
      message: `Status do pagamento atualizado para ${status}`,
      data: {
        paymentId: payment._id,
        orderId: payment.orderId,
        status: payment.status,
        notificationSent: true
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
