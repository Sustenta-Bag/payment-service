const mercadopago = require('mercadopago');
const config = require('../config/config');
const logger = require('../utils/logger');

class MercadoPagoService {
  constructor() {
    mercadopago.configure({
      access_token: config.mercadopago.accessToken
    });
  }

  /**
   * Cria uma preferência de pagamento para sacolas misteriosas
   * @param {Object} paymentData Dados do pagamento
   * @returns {Promise<Object>} Preferência de pagamento criada
   */
  async createPreference(paymentData) {
    try {
      const preference = {
        items: paymentData.items.map(item => ({
          title: item.title,
          description: item.description || 'Sacola misteriosa com produtos próximos à validade',
          quantity: item.quantity,
          unit_price: item.unitPrice,
          currency_id: paymentData.currency || 'BRL'
        })),
        external_reference: paymentData.orderId,
        payer: {
          name: paymentData.payer.name,
          email: paymentData.payer.email,
          identification: {
            type: paymentData.payer.documentType || 'CPF',
            number: paymentData.payer.documentNumber
          }
        },
        back_urls: {
          success: `${paymentData.callbackUrl}/success`,
          failure: `${paymentData.callbackUrl}/failure`,
          pending: `${paymentData.callbackUrl}/pending`
        },
        auto_return: 'approved',
        notification_url: config.mercadopago.webhookUrl,
        statement_descriptor: 'ZeroWaste',
        metadata: {
          orderId: paymentData.orderId,
          userId: paymentData.userId
        }
      };

      const response = await mercadopago.preferences.create(preference);
      logger.info(`Preferência de pagamento criada: ${paymentData.orderId}`);
      return response.response;
    } catch (error) {
      logger.error(`Erro ao criar preferência de pagamento: ${error.message}`);
      throw new Error(`Erro ao criar preferência de pagamento: ${error.message}`);
    }
  }

  /**
   * Verifica o status de um pagamento
   * @param {String} paymentId ID do pagamento no Mercado Pago
   * @returns {Promise<Object>} Dados do pagamento
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await mercadopago.payment.get(paymentId);
      return response.response;
    } catch (error) {
      logger.error(`Erro ao verificar status do pagamento: ${error.message}`);
      throw new Error(`Erro ao verificar status do pagamento: ${error.message}`);
    }
  }

  /**
   * Processa notificação do webhook do Mercado Pago
   * @param {Object} notification Dados da notificação
   * @returns {Promise<Object>} Dados do pagamento processado
   */
  async processWebhook(notification) {
    try {
      if (notification.type === 'payment') {
        const paymentId = notification.data.id;
        const paymentInfo = await this.getPaymentStatus(paymentId);
        
        return {
          mercadopagoId: paymentInfo.id,
          status: this.mapPaymentStatus(paymentInfo.status),
          paymentMethod: paymentInfo.payment_method_id,
          metadata: {
            externalReference: paymentInfo.external_reference,
            ...paymentInfo.metadata
          }
        };
      }
      return null;
    } catch (error) {
      logger.error(`Erro ao processar webhook: ${error.message}`);
      throw new Error(`Erro ao processar webhook: ${error.message}`);
    }
  }

  /**
   * Mapeia status do Mercado Pago para status internos
   * @param {String} mpStatus Status do Mercado Pago
   * @returns {String} Status interno
   */
  mapPaymentStatus(mpStatus) {
    const statusMap = {
      approved: 'approved',
      pending: 'pending',
      rejected: 'rejected',
      cancelled: 'cancelled',
      refunded: 'refunded',
      in_process: 'pending',
      in_mediation: 'pending',
      charged_back: 'rejected'
    };
    return statusMap[mpStatus] || 'pending';
  }
}

module.exports = new MercadoPagoService();