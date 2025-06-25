const rabbitMQService = require("./rabbitMQ");
const notificationService = require("./notificationService");
const config = require("../config/config");
const logger = require("../utils/logger");

/**
 * Configura e inicia todos os consumidores RabbitMQ
 */
class QueueConsumers {
  constructor() {
    this.isRunning = false;
    this.consumers = [];
  }

  /**
   * Função utilitária para aguardar um delay
   * @param {number} ms - Milissegundos para aguardar
   * @returns {Promise<void>}
   */
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Inicia todos os consumidores com retry
   */
  async startConsumers() {
    const maxRetries = config.rabbitmq.maxRetries;
    const retryDelayMs = config.rabbitmq.retryDelayMs;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(
          `🔄 Tentativa ${attempt}/${maxRetries} de inicialização dos consumidores...`
        );

        await this.startPaymentResultConsumer();

        this.isRunning = true;
        logger.info(
          `✅ Todos os consumidores RabbitMQ foram iniciados na tentativa ${attempt}`
        );
        return;
      } catch (error) {
        logger.error(
          `❌ Falha na tentativa ${attempt}/${maxRetries} de inicialização: ${error.message}`
        );

        if (attempt === maxRetries) {
          logger.error(
            `💥 Esgotadas todas as ${maxRetries} tentativas de inicialização dos consumidores`
          );
          throw new Error(
            `Falha na inicialização dos consumidores após ${maxRetries} tentativas: ${error.message}`
          );
        }

        logger.info(
          `⏳ Aguardando ${retryDelayMs}ms antes da próxima tentativa...`
        );
        await this.delay(retryDelayMs);
      }
    }
  }

  /**
   * Para todos os consumidores
   */
  async stopConsumers() {
    this.isRunning = false;
    logger.info("🛑 Parando todos os consumidores RabbitMQ...");
  }

  /**
   * Consumidor para processar resultados de pagamento
   * Processa notificações de usuário de forma assíncrona com retry
   */
  async startPaymentResultConsumer() {
    await rabbitMQService.consume(
      config.rabbitmq.queues.paymentResults,
      async (message) => {
        await this.processPaymentResult(message);
      }
    );

    logger.info("🔄 Consumidor de resultados de pagamento iniciado");
  }

  /**
   * Processa resultado de pagamento com retry para notificações
   * @param {Object} message - Mensagem recebida do RabbitMQ
   */
  async processPaymentResult(message) {
    try {
      logger.info(
        `📥 Processando resultado de pagamento: ${JSON.stringify(message)}`
      );

      const { eventType, version, producer, timestamp, correlationId, data } =
        message;
      const { paymentId, orderId, userId, status, shouldNotifyUser } = data;

      logger.info(
        `📋 Evento recebido: ${eventType} v${version} de ${producer} (correlationId: ${correlationId})`
      );

      if (
        shouldNotifyUser &&
        (status === "approved" || status === "rejected")
      ) {
        logger.info(
          `📱 Enviando notificação assíncrona para usuário ${userId}...`
        );

        await this.sendNotificationWithRetry(userId, status, {
          _id: paymentId,
          orderId: orderId,
          amount: data.amount,
        });
      }

      logger.info(
        `✅ Resultado de pagamento processado: orderId=${orderId}, status=${status}`
      );
    } catch (error) {
      logger.error(
        `❌ Erro ao processar resultado de pagamento: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Envia notificação com retry
   * @param {string} userId - ID do usuário
   * @param {string} status - Status do pagamento
   * @param {Object} paymentData - Dados do pagamento
   */
  async sendNotificationWithRetry(userId, status, paymentData) {
    const maxRetries = 3;
    const retryDelayMs = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await notificationService.sendPaymentNotification(
          userId,
          status,
          paymentData
        );

        logger.info(
          `✅ Notificação de pagamento ${status} enviada para o usuário ${userId} (tentativa ${attempt})`
        );
        return;
      } catch (notificationError) {
        logger.error(
          `❌ Falha na tentativa ${attempt}/${maxRetries} de envio de notificação para usuário ${userId}: ${notificationError.message}`
        );

        if (attempt === maxRetries) {
          logger.error(
            `💥 Esgotadas todas as ${maxRetries} tentativas de envio de notificação para usuário ${userId}`
          );
          return;
        }

        logger.info(
          `⏳ Aguardando ${retryDelayMs}ms antes da próxima tentativa de notificação...`
        );
        await this.delay(retryDelayMs);
      }
    }
  }

  /**
   * Verifica se os consumidores estão rodando
   * @returns {boolean}
   */
  isHealthy() {
    return this.isRunning;
  }
}

module.exports = new QueueConsumers();
