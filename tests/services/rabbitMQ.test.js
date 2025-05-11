const rabbitMQService = require('../../src/services/rabbitMQ');
const amqplib = require('amqplib');

// Mock do módulo amqplib
jest.mock('amqplib', () => {
  // Mock da conexão
  const connectionMock = {
    createChannel: jest.fn().mockResolvedValue({
      assertExchange: jest.fn().mockResolvedValue({}),
      assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue' }),
      bindQueue: jest.fn().mockResolvedValue({}),
      publish: jest.fn().mockReturnValue(true),
      consume: jest.fn().mockImplementation((queue, callback) => {
        // Simular uma mensagem
        callback({ content: Buffer.from(JSON.stringify({ test: 'data' })) });
        return { consumerTag: 'test-consumer' };
      }),
      ack: jest.fn(),
      close: jest.fn().mockResolvedValue({})
    }),
    close: jest.fn().mockResolvedValue({})
  };

  return {
    connect: jest.fn().mockResolvedValue(connectionMock)
  };
});

describe('RabbitMQ Service', () => {
  let originalConsole;
  
  beforeEach(() => {
    // Preservar console.error original e silenciar logs durante testes
    originalConsole = console.error;
    console.error = jest.fn();
  });
  
  afterEach(() => {
    // Restaurar console.error original
    console.error = originalConsole;
    // Limpar mocks entre testes
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('deve conectar ao RabbitMQ com sucesso', async () => {
      const result = await rabbitMQService.connect();
      expect(result).toBe(true);
      expect(amqplib.connect).toHaveBeenCalled();
    });

    it('deve lidar com erro de conexão', async () => {
      amqplib.connect.mockRejectedValueOnce(new Error('Connection error'));
      
      const result = await rabbitMQService.connect();
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('deve publicar mensagem com sucesso', async () => {
      // Primeiro conectar
      await rabbitMQService.connect();
      
      // Depois tentar publicar
      const result = await rabbitMQService.publish(
        'test-exchange',
        'test-routing-key',
        { data: 'test-data' }
      );
      
      expect(result).toBe(true);
    });

    it('deve lidar com erro quando não conectado', async () => {
      // Forçar estado não conectado
      rabbitMQService.channel = null;
      
      const result = await rabbitMQService.publish(
        'test-exchange',
        'test-routing-key',
        { data: 'test-data' }
      );
      
      expect(result).toBe(false);
    });
  });

  describe('consume', () => {
    it('deve consumir mensagens com sucesso', async () => {
      // Primeiro conectar
      await rabbitMQService.connect();
      
      // Mock da função de callback
      const callback = jest.fn();
      
      // Tentar consumir
      const result = await rabbitMQService.consume(
        'test-queue',
        callback
      );
      
      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledWith({ test: 'data' });
    });

    it('deve lidar com erro quando não conectado', async () => {
      // Forçar estado não conectado
      rabbitMQService.channel = null;
      
      const callback = jest.fn();
      
      const result = await rabbitMQService.consume(
        'test-queue',
        callback
      );
      
      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('deve fechar a conexão com sucesso', async () => {
      // Primeiro conectar
      await rabbitMQService.connect();
      
      // Depois tentar fechar
      const result = await rabbitMQService.close();
      
      expect(result).toBe(true);
    });

    it('deve lidar com erro quando não conectado', async () => {
      // Forçar estado não conectado
      rabbitMQService.connection = null;
      
      const result = await rabbitMQService.close();
      
      expect(result).toBe(false);
    });
  });
});
