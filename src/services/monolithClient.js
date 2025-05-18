const axios = require('axios');
const logger = require('../utils/logger');

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
      
      const response = await axios.get(`${this.authBaseUrl}/user/${userId}/fcm-token`, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000 // timeout de 5 segundos
      });

      if (response.status === 200 && response.data && response.data.token) {
        logger.info(`Token FCM recuperado com sucesso para o usuário ${userId}`);
        return response.data.token;
      }
      
      logger.warn(`Token FCM não encontrado para o usuário ${userId} no monolito`);
      return null;
    } catch (error) {
      logger.error(`Erro ao recuperar token FCM do monolito: ${error.message}`);
      // Mesmo em caso de erro, continuamos o fluxo retornando null
      return null;
    }
  }
}

module.exports = new MonolithClient();
