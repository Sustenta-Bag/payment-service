const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class PaymentSimulationService {
  /**
   * Cria uma simulação de preferência de pagamento
   * @param {Object} paymentData Dados do pagamento
   * @returns {Promise<Object>} Preferência de pagamento simulada
   */
  async createPaymentIntent(paymentData) {
    try {
      const simulatedId = uuidv4();
      const totalAmount = paymentData.items.reduce((total, item) => {
        return total + (item.unitPrice * item.quantity);
      }, 0);
      
      // Cria uma URL simulada para pagamento
      const paymentUrl = `/payment-simulation/${simulatedId}?orderId=${paymentData.orderId}&amount=${totalAmount}`;
      
      logger.info(`Simulação de pagamento criada: ${paymentData.orderId}`);
      
      return {
        id: simulatedId,
        init_point: paymentUrl,
        external_reference: paymentData.orderId,
        total_amount: totalAmount,
        items: paymentData.items,
        payer: paymentData.payer,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Erro ao criar simulação de pagamento: ${error.message}`);
      throw new Error(`Erro ao criar simulação de pagamento: ${error.message}`);
    }
  }

  /**
   * Simula obter status de um pagamento
   * @param {String} paymentId ID do pagamento simulado
   * @returns {Promise<Object>} Dados do pagamento simulado
   */
  async getPaymentStatus(paymentId) {
    try {
      // Em um cenário real, aqui buscaria do banco de dados
      // Estamos simulando o retorno de um status
      return {
        id: paymentId,
        status: this.getRandomStatus(),
        payment_method_id: 'credit_card',
        status_detail: 'accredited',
        date_approved: new Date().toISOString(),
        date_created: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Erro ao verificar status do pagamento: ${error.message}`);
      throw new Error(`Erro ao verificar status do pagamento: ${error.message}`);
    }
  }

  /**
   * Gera um status aleatório para simulação de pagamento
   * @returns {String} Status simulado
   */
  getRandomStatus() {
    const statuses = ['approved', 'pending', 'rejected'];
    const randomIndex = Math.floor(Math.random() * statuses.length);
    return statuses[randomIndex];
  }

  /**
   * Simula processamento de uma notificação de pagamento
   * @param {Object} notification Dados da notificação
   * @returns {Promise<Object>} Dados do pagamento processado
   */
  async processPaymentNotification(notification) {
    try {
      if (notification.type === 'payment') {
        const paymentId = notification.data.id;
        const paymentInfo = await this.getPaymentStatus(paymentId);
        
        return {
          paymentId: paymentInfo.id,
          status: paymentInfo.status,
          paymentMethod: paymentInfo.payment_method_id,
          metadata: {
            orderId: notification.data.orderId,
            externalReference: notification.data.orderId,
            userId: notification.data.userId
          }
        };
      }
      return null;
    } catch (error) {
      logger.error(`Erro ao processar notificação: ${error.message}`);
      throw new Error(`Erro ao processar notificação: ${error.message}`);
    }
  }

  /**
   * Simula a aprovação manual de um pagamento
   * @param {String} orderId ID do pedido
   * @returns {Promise<Object>} Dados do pagamento simulado
   */
  async approvePayment(orderId) {
    try {
      logger.info(`Aprovando pagamento para pedido: ${orderId}`);
      return {
        paymentId: uuidv4(),
        status: 'approved',
        paymentMethod: 'credit_card',
        metadata: {
          orderId: orderId
        }
      };
    } catch (error) {
      logger.error(`Erro ao aprovar pagamento: ${error.message}`);
      throw new Error(`Erro ao aprovar pagamento: ${error.message}`);
    }
  }

  /**
   * Simula a rejeição manual de um pagamento
   * @param {String} orderId ID do pedido
   * @returns {Promise<Object>} Dados do pagamento simulado
   */
  async rejectPayment(orderId) {
    try {
      logger.info(`Rejeitando pagamento para pedido: ${orderId}`);
      return {
        paymentId: uuidv4(),
        status: 'rejected',
        paymentMethod: 'credit_card',
        metadata: {
          orderId: orderId
        }
      };
    } catch (error) {
      logger.error(`Erro ao rejeitar pagamento: ${error.message}`);
      throw new Error(`Erro ao rejeitar pagamento: ${error.message}`);
    }
  }
}

module.exports = new PaymentSimulationService();
