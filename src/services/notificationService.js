const { v4: uuidv4 } = require("uuid");
const rabbitMQService = require("./rabbitMQ");
const monolithClient = require("./monolithClient");
const config = require("../config/config");
const logger = require("../utils/logger");

class NotificationService {
  /**
   * Envia uma notificação para o usuário via RabbitMQ
   * @param {String} userId ID do usuário
   * @param {String} title Título da notificação
   * @param {String} body Corpo da notificação
   * @param {Object} data Dados adicionais da notificação
   * @returns {Promise<boolean>} Se a notificação foi enviada com sucesso
   */
  async sendNotification(userId, title, body, data = {}) {
    logger.info(
      `Enviando notificação para o usuário: ${userId} | Título: ${title}`
    );
    try {
      const fcmToken = await monolithClient.getUserFcmToken(userId);
      if (!fcmToken) {
        logger.warn(
          `Token FCM não encontrado para o usuário ${userId}. Notificação não enviada.`
        );
        return false;
      }

      logger.debug(`Enviando notificação: ${title} - ${body}`);

      const result = await rabbitMQService.publish(
        config.rabbitmq.exchanges.notifications,
        "notification",
        {
          eventType: "NotificationRequested",
          version: "1.0",
          producer: "payment-service",
          timestamp: new Date(),
          correlationId: uuidv4(),
          data: {
            to: fcmToken,
            notification: {
              title,
              body,
            },
            data,
            userId: userId,
            timestamp: new Date().toISOString(),
          },
        }
      );

      if (result) {
        logger.info(
          `Notificação enviada para o serviço de notificações para o usuário ${userId}`
        );
        return true;
      }

      logger.warn(
        `Falha ao enviar notificação para RabbitMQ para o usuário ${userId}`
      );
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
      console.log(
        `Enviando notificação de pagamento para o usuário: ${userId} | Status: ${status}`
      );
      if (status === "approved") {
        title = "Pagamento aprovado";
        body = `Seu pagamento no valor de R$${paymentData.amount.toFixed(
          2
        )} foi aprovado com sucesso!`;
      } else if (status === "rejected") {
        title = "Pagamento recusado";
        body = `Infelizmente seu pagamento no valor de R$${paymentData.amount.toFixed(
          2
        )} foi recusado.`;
      } else {
        title = "Atualização de pagamento";
        body = `O status do seu pagamento foi atualizado para: ${status}`;
      }
      const notificationData = {
        type: "single",
        paymentId: paymentData._id.toString(),
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        status: status,
        currency: "BRL",
        paymentMethod: paymentData.paymentMethod || "unknown",
        items: paymentData.items || [],
        timestamp: new Date().toISOString(),
      };

      return await this.sendNotification(userId, title, body, notificationData);
    } catch (error) {
      logger.error(`Erro ao enviar notificação de pagamento: ${error.message}`);
      return false;
    }
  }
}

module.exports = new NotificationService();
