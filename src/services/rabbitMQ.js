const amqp = require("amqplib");
const config = require("../config/config");
const logger = require("../utils/logger");

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
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
   * Conecta com o servidor RabbitMQ com retry
   * @returns {Promise<void>}
   */
  async connect() {
    const maxRetries = config.rabbitmq.maxRetries;
    const retryDelayMs = config.rabbitmq.retryDelayMs;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(
          `🔄 Tentativa ${attempt}/${maxRetries} de conexão com RabbitMQ...`
        );

        this.connection = await amqp.connect(config.rabbitmq.url);
        this.channel = await this.connection.createChannel();

        await this.setupExchangesAndQueues();

        logger.info(`✅ Conectado ao RabbitMQ na tentativa ${attempt}`);
        return;
      } catch (error) {
        logger.error(
          `❌ Falha na tentativa ${attempt}/${maxRetries} de conexão: ${error.message}`
        );

        if (attempt === maxRetries) {
          logger.error(
            `💥 Esgotadas todas as ${maxRetries} tentativas de conexão com RabbitMQ`
          );
          throw new Error(
            `Falha na conexão com RabbitMQ após ${maxRetries} tentativas: ${error.message}`
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
   * Configura exchanges e filas
   * @returns {Promise<void>}
   */
  async setupExchangesAndQueues() {
    await this.channel.assertExchange(
      config.rabbitmq.exchanges.payments,
      "topic",
      { durable: true }
    );

    await this.channel.assertExchange(
      config.rabbitmq.exchanges.notifications,
      "direct",
      { durable: true }
    );

    await this.channel.assertQueue(config.rabbitmq.queues.paymentRequests, {
      durable: true,
    });
    await this.channel.assertQueue(config.rabbitmq.queues.paymentResults, {
      durable: true,
    });
    await this.channel.assertQueue(config.rabbitmq.queues.notifications, {
      durable: true,
    });

    await this.channel.bindQueue(
      config.rabbitmq.queues.paymentRequests,
      config.rabbitmq.exchanges.payments,
      "payment.request"
    );
    await this.channel.bindQueue(
      config.rabbitmq.queues.paymentResults,
      config.rabbitmq.exchanges.payments,
      "payment.result"
    );
    await this.channel.bindQueue(
      config.rabbitmq.queues.notifications,
      config.rabbitmq.exchanges.notifications,
      "notification"
    );
  }

  /**
   * Publica uma mensagem em um exchange com retry
   * @param {String} exchange Nome do exchange
   * @param {String} routingKey Chave de roteamento
   * @param {Object} message Mensagem para publicar
   * @returns {Promise<boolean>} Se foi publicada com sucesso
   */
  async publish(exchange, routingKey, message) {
    const maxRetries = config.rabbitmq.maxRetries;
    const retryDelayMs = config.rabbitmq.retryDelayMs;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!this.channel) {
          await this.connect();
        }

        const result = this.channel.publish(
          exchange,
          routingKey,
          Buffer.from(JSON.stringify(message)),
          { persistent: true }
        );

        logger.info(
          `✅ Mensagem publicada com sucesso na tentativa ${attempt}`
        );
        return result;
      } catch (error) {
        logger.error(
          `❌ Falha na tentativa ${attempt}/${maxRetries} de publicação: ${error.message}`
        );

        this.connection = null;
        this.channel = null;

        if (attempt === maxRetries) {
          logger.error(
            `💥 Esgotadas todas as ${maxRetries} tentativas de publicação`
          );
          throw new Error(
            `Falha na publicação após ${maxRetries} tentativas: ${error.message}`
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
   * Consome mensagens de uma fila com retry
   * @param {String} queue Nome da fila
   * @param {Function} callback Função para processar mensagens
   * @returns {Promise<void>}
   */
  async consume(queue, callback) {
    const maxRetries = config.rabbitmq.maxRetries;
    const retryDelayMs = config.rabbitmq.retryDelayMs;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!this.channel) {
          await this.connect();
        }

        await this.channel.consume(queue, async (msg) => {
          if (msg !== null) {
            try {
              const content = JSON.parse(msg.content.toString());
              await callback(content);
              this.channel.ack(msg);
            } catch (error) {
              logger.error(`Erro ao processar mensagem: ${error.message}`);
              this.channel.nack(msg);
            }
          }
        });

        logger.info(
          `✅ Consumindo mensagens da fila: ${queue} (tentativa ${attempt})`
        );
        return;
      } catch (error) {
        logger.error(
          `❌ Falha na tentativa ${attempt}/${maxRetries} de consumo: ${error.message}`
        );

        this.connection = null;
        this.channel = null;

        if (attempt === maxRetries) {
          logger.error(
            `💥 Esgotadas todas as ${maxRetries} tentativas de consumo`
          );
          throw new Error(
            `Falha no consumo após ${maxRetries} tentativas: ${error.message}`
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
   * Fecha a conexão com o RabbitMQ
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info("Conexão com RabbitMQ fechada");
    } catch (error) {
      logger.error(`Erro ao fechar conexão: ${error.message}`);
    }
  }
}

module.exports = new RabbitMQService();
