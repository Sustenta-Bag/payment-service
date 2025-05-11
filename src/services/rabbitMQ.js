const amqp = require('amqplib');
const config = require('../config/config');
const logger = require('../utils/logger');

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  /**
   * Conecta com o servidor RabbitMQ
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();
        // Configura exchanges
      await this.channel.assertExchange(
        config.rabbitmq.exchanges.payments, 
        'topic', 
        { durable: true }
      );
      
      // Configura exchange para notificações
      await this.channel.assertExchange(
        config.rabbitmq.exchanges.notifications,
        'direct',
        { durable: true }
      );
      
      // Configura filas
      await this.channel.assertQueue(
        config.rabbitmq.queues.paymentRequests, 
        { durable: true }
      );
      await this.channel.assertQueue(
        config.rabbitmq.queues.paymentResults, 
        { durable: true }
      );
      
      // Bind das filas aos exchanges
      await this.channel.bindQueue(
        config.rabbitmq.queues.paymentRequests,
        config.rabbitmq.exchanges.payments,
        'payment.request'
      );
      await this.channel.bindQueue(
        config.rabbitmq.queues.paymentResults,
        config.rabbitmq.exchanges.payments,
        'payment.result'
      );
      
      logger.info('Conectado ao RabbitMQ');
    } catch (error) {
      logger.error(`Erro ao conectar ao RabbitMQ: ${error.message}`);
      throw error;
    }
  }

  /**
   * Publica uma mensagem em um exchange
   * @param {String} exchange Nome do exchange
   * @param {String} routingKey Chave de roteamento
   * @param {Object} message Mensagem para publicar
   * @returns {Promise<boolean>} Se foi publicada com sucesso
   */
  async publish(exchange, routingKey, message) {
    try {
      if (!this.channel) {
        await this.connect();
      }
      
      return this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
    } catch (error) {
      logger.error(`Erro ao publicar mensagem: ${error.message}`);
      throw error;
    }
  }

  /**
   * Consome mensagens de uma fila
   * @param {String} queue Nome da fila
   * @param {Function} callback Função para processar mensagens
   * @returns {Promise<void>}
   */
  async consume(queue, callback) {
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
      
      logger.info(`Consumindo mensagens da fila: ${queue}`);
    } catch (error) {
      logger.error(`Erro ao consumir mensagens: ${error.message}`);
      throw error;
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
      logger.info('Conexão com RabbitMQ fechada');
    } catch (error) {
      logger.error(`Erro ao fechar conexão: ${error.message}`);
    }
  }
}

module.exports = new RabbitMQService();