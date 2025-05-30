const axios = require('axios');
const logger = require('../utils/logger');
const { log } = require('winston');

class MonolithClient {
  constructor() {
    this.baseUrl = process.env.MONOLITH_BASE_URL || 'http://localhost:3000';
    this.authBaseUrl = `${this.baseUrl}/api/auth`;
  }
  /**
   * Recupera o token FCM do usuário a partir do serviço de autenticação do monolito
   * @param {String} userId ID do usuário
   * @returns {Promise<String|null>} Token FCM do usuário ou null se não encontrado
   */
  async getUserFcmToken(userId) {
    try {
      logger.info(`Recuperando token FCM do usuário ${userId} do monolito`);
      logger.debug(`URL de autenticação: ${this.authBaseUrl}/user/${userId}/fcm-token`);
      
      const response = await axios.get(`${this.authBaseUrl}/user/${userId}/fcm-token`, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000 
      });

      if (response.status === 200 && response.data && response.data.token) {
        logger.info(`Token FCM recuperado com sucesso para o usuário ${userId}`);
        return response.data.token;
      }
      
      logger.warn(`Token FCM não encontrado para o usuário ${userId} no monolito`);
      return null;
    } catch (error) {
      logger.error(`Erro ao recuperar token FCM do monolito: ${error.message}`);
      return null;
    }
  }

  /**
   * Notifica o monólito sobre atualização de status de pagamento
   * @param {String} orderId ID da ordem
   * @param {String} status Status do pagamento (approved, rejected, cancelled, etc.)
   * @param {String} paymentId ID do pagamento
   * @returns {Promise<boolean>} Se a notificação foi enviada com sucesso
   */
  async notifyPaymentStatusUpdate(orderId, status, paymentId) {
    try {
      logger.info(`Notificando monólito sobre atualização de pagamento: ordem ${orderId}, status ${status}`);
      
      const webhookUrl = `${this.baseUrl}/api/payments/webhook`;
      const response = await axios.post(webhookUrl, {
        orderId,
        status,
        paymentId
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.status === 200) {
        logger.info(`Monólito notificado com sucesso sobre pagamento ${orderId}`);
        return true;
      }
      
      logger.warn(`Resposta inesperada do monólito: ${response.status}`);
      return false;
    } catch (error) {
      logger.error(`Erro ao notificar monólito sobre pagamento: ${error.message}`);
      return false;
    }
  }
}

module.exports = new MonolithClient();
