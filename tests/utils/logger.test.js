const logger = require('../../src/utils/logger');

describe('Logger Utility', () => {
  let originalConsole;
  let mockConsole;

  beforeEach(() => {
    // Guardar console original
    originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    // Mock do console
    mockConsole = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };

    // Substituir métodos do console
    console.log = mockConsole.log;
    console.error = mockConsole.error;
    console.warn = mockConsole.warn;
    console.info = mockConsole.info;
    console.debug = mockConsole.debug;
  });

  afterEach(() => {
    // Restaurar console original
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
  });

  describe('Níveis de log', () => {
    it('deve registrar mensagem de erro', () => {
      logger.error('Mensagem de erro');
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('deve registrar mensagem de alerta', () => {
      logger.warn('Mensagem de alerta');
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('deve registrar mensagem de informação', () => {
      logger.info('Mensagem de informação');
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('deve registrar mensagem de debug', () => {
      logger.debug('Mensagem de debug');
      expect(mockConsole.debug).toHaveBeenCalled();
    });
  });

  describe('Formato de log', () => {
    it('deve incluir timestamp na mensagem', () => {
      logger.info('Mensagem de teste');
      
      // Verificar se o console.info foi chamado com uma string
      // que contém um formato de data/hora
      const call = mockConsole.info.mock.calls[0][0];
      expect(call).toEqual(expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/));
    });

    it('deve incluir nível de log na mensagem', () => {
      logger.info('Mensagem de teste');
      
      const call = mockConsole.info.mock.calls[0][0];
      expect(call).toEqual(expect.stringMatching(/\[INFO\]/));
    });

    it('deve incluir a mensagem fornecida', () => {
      const message = 'Esta é uma mensagem de teste específica';
      logger.info(message);
      
      const call = mockConsole.info.mock.calls[0][0];
      expect(call).toEqual(expect.stringContaining(message));
    });
  });
});
