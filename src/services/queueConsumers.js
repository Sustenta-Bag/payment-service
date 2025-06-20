const rabbitMQService = require("./rabbitMQ");
const notificationService = require("./notificationService");
const config = require("../config/config");
const logger = require("../utils/logger");

/**
 * Configura e inicia todos os consumidores RabbitMQ
 */
class QueueConsumers {
  /**
   * Inicia todos os consumidores
   */
  async startConsumers() {
    try {
      await this.startPaymentResultConsumer();

      logger.info("Todos os consumidores RabbitMQ foram iniciados");
    } catch (error) {
      logger.error(`Erro ao iniciar consumidores: ${error.message}`);
      throw error;
    }
  }

  /**
   * Consumidor para processar resultados de pagamento
   * Processa notificações de usuário de forma assíncrona
   */
  async startPaymentResultConsumer() {
    await rabbitMQService.consume(
      config.rabbitmq.queues.paymentResults,
      async (message) => {
        try {
          logger.info(
            `📥 Processando resultado de pagamento: ${JSON.stringify(message)}`
          );

          const {
            eventType,
            version,
            producer,
            timestamp,
            correlationId,
            data,
          } = message;
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

            try {
              await notificationService.sendPaymentNotification(
                userId,
                status,
                {
                  _id: paymentId,
                  orderId: orderId,
                  amount: data.amount
                }
              );

              logger.info(
                `✅ Notificação de pagamento ${status} enviada para o usuário ${userId}`
              );
            } catch (notificationError) {
              logger.error(
                `❌ Erro ao enviar notificação para usuário ${userId}: ${notificationError.message}`
              );
            }
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
    );

    logger.info("🔄 Consumidor de resultados de pagamento iniciado");
  }
}

module.exports = new QueueConsumers();
