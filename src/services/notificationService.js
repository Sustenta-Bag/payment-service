const rabbitMQService = require('./rabbitMQ');
const config = require('../config/config');
const logger = require('../utils/logger');

class NotificationService {  /**
   * Envia uma notificação para o usuário via RabbitMQ
   * @param {String} userId ID do usuário
   * @param {String} title Título da notificação
   * @param {String} body Corpo da notificação
   * @param {Object} data Dados adicionais da notificação
   * @returns {Promise<boolean>} Se a notificação foi enviada com sucesso
   */  
  async sendNotification(userId, title, body, data = {}) {
    logger.info(`Enviando notificação para o usuário: ${userId} | Título: ${title}`);
    try {
      const notificationData = {
        to: "c0_upvfUQr62sCIQOfCfrl:APA91bFgN19CkI73zEpcoeY1VjbB2ZbSZrK2xHDPBU3oTMY-0Uet1JVbf1tOAzrEtP08uJrliS2KVd-Vp80_YW2pA_RyKs_YQPz58WZhwJ0xaqJ1Ag4msRE",
        notification: {
          title,
          body
        },
        data,
        timestamp: new Date().toISOString()
      };
      
      logger.debug(`Dados da notificação: ${JSON.stringify(notificationData)}`);
      
      const result = await rabbitMQService.publish(
        config.rabbitmq.exchanges.notifications,
        'notification',
        notificationData
      );
      
      if (result) {
        logger.info(`Notificação enviada para o serviço de notificações para o usuário ${userId}`);
        return true;
      }
      
      logger.warn(`Falha ao enviar notificação para RabbitMQ para o usuário ${userId}`);
      return false;
    } catch (error) {
      logger.error(`Erro ao enviar notificação: ${error.message}`);
      return false;
    }
  }

  /**
   * Envia notificação de pagamento baseado no status
   * @param {String} userId ID do usuário
   * @param {String} status Status do pagamento ('approved' ou 'rejected')
   * @param {Object} paymentData Dados do pagamento
   * @returns {Promise<boolean>} Se a notificação foi enviada com sucesso
   */
  async sendPaymentNotification(userId, status, paymentData) {
    try {
      let title, body;
      
      if (status === 'approved') {
        title = 'Pagamento aprovado';
        body = `Seu pagamento no valor de R$${paymentData.amount.toFixed(2)} foi aprovado com sucesso!`;
      } else if (status === 'rejected') {
        title = 'Pagamento recusado';
        body = `Infelizmente seu pagamento no valor de R$${paymentData.amount.toFixed(2)} foi recusado.`;
      } else {
        title = 'Atualização de pagamento';
        body = `O status do seu pagamento foi atualizado para: ${status}`;
      }
      
      const notificationData = {
        paymentId: paymentData._id.toString(),
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        status: status
      };
      
      return await this.sendNotification(userId, title, body, notificationData);
    } catch (error) {
      logger.error(`Erro ao enviar notificação de pagamento: ${error.message}`);
      return false;
    }  }
}

module.exports = new NotificationService();
