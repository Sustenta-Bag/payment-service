const amqp = require('amqplib');
const rabbitMQService = require('../../src/services/rabbitMQ');
const config = require('../../src/config/config');

jest.mock('amqplib');

describe('RabbitMQService', () => {
  let mockChannel;
  let mockConnection;

  beforeEach(() => {
    mockChannel = {
      assertExchange: jest.fn(),
      publish: jest.fn().mockReturnValue(true),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn()
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn()
    };

    amqp.connect = jest.fn().mockResolvedValue(mockConnection);
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('deve conectar ao RabbitMQ com sucesso', async () => {
      await rabbitMQService.connect();

      expect(amqp.connect).toHaveBeenCalledWith(config.rabbitmq.url);
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        config.rabbitmq.exchanges.payments,
        'topic',
        { durable: true }
      );
    });

    it('deve lançar erro se a conexão falhar', async () => {
      const error = new Error('Erro de conexão');
      amqp.connect.mockRejectedValue(error);

      await expect(rabbitMQService.connect()).rejects.toThrow('Erro de conexão');
    });
  });

  describe('publish', () => {
    it('deve publicar mensagem com sucesso', async () => {
      const message = { data: 'test' };
      const routingKey = 'test.key';

      await rabbitMQService.connect();
      const result = await rabbitMQService.publish(
        config.rabbitmq.exchanges.payments,
        routingKey,
        message
      );

      expect(result).toBe(true);
      expect(mockChannel.publish).toHaveBeenCalledWith(
        config.rabbitmq.exchanges.payments,
        routingKey,
        expect.any(Buffer),
        { persistent: true }
      );
    });

    it('deve reconectar se o canal não existir', async () => {
      const message = { data: 'test' };
      rabbitMQService.channel = null;

      await rabbitMQService.publish(
        config.rabbitmq.exchanges.payments,
        'test.key',
        message
      );

      expect(amqp.connect).toHaveBeenCalled();
    });

    it('deve lançar erro se a mensagem for inválida', async () => {
      await rabbitMQService.connect();
      mockChannel.publish.mockImplementation(() => {
        throw new Error('Mensagem inválida');
      });

      await expect(
        rabbitMQService.publish(
          config.rabbitmq.exchanges.payments,
          'test.key',
          undefined
        )
      ).rejects.toThrow();
    });
  });

  describe('consume', () => {
    it('deve consumir mensagens com sucesso', async () => {
      const callback = jest.fn();
      const queue = config.rabbitmq.queues.paymentRequests;
      const message = { content: Buffer.from(JSON.stringify({ data: 'test' })) };

      await rabbitMQService.connect();
      await rabbitMQService.consume(queue, callback);

      // Simula o recebimento de uma mensagem
      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(message);

      expect(mockChannel.consume).toHaveBeenCalledWith(
        queue,
        expect.any(Function)
      );
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
      expect(mockChannel.ack).toHaveBeenCalledWith(message);
    });

    it('deve fazer nack em caso de erro no processamento', async () => {
      const callback = jest.fn().mockRejectedValue(new Error('Erro no processamento'));
      const queue = config.rabbitmq.queues.paymentRequests;
      const message = { content: Buffer.from(JSON.stringify({ data: 'test' })) };

      await rabbitMQService.connect();
      await rabbitMQService.consume(queue, callback);

      const consumeCallback = mockChannel.consume.mock.calls[0][1];
      await consumeCallback(message);

      expect(mockChannel.nack).toHaveBeenCalledWith(message);
    });
  });

  describe('close', () => {
    it('deve fechar a conexão com sucesso', async () => {
      await rabbitMQService.connect();
      await rabbitMQService.close();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('não deve lançar erro se não houver conexão', async () => {
      rabbitMQService.channel = null;
      rabbitMQService.connection = null;

      await expect(rabbitMQService.close()).resolves.not.toThrow();
    });
  });
}); 