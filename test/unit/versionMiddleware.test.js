const versionMiddleware = require('../../src/middlewares/versionMiddleware');

describe('versionMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { protocol: 'http', get: jest.fn().mockReturnValue('localhost:3000'), query: {}, headers: {}, get: jest.fn((h) => h === 'Accept' ? undefined : 'localhost:3000') };
    res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  describe('addVersionHeaders', () => {
    it('deve adicionar headers de versão', () => {
      versionMiddleware.addVersionHeaders('2.0.0')(req, res, next);
      expect(res.set).toHaveBeenCalledWith('X-API-Version', '2.0.0');
      expect(res.set).toHaveBeenCalledWith('Link', expect.stringContaining('current-version'));
      expect(next).toHaveBeenCalled();
    });
  });

  describe('versionedEndpoint', () => {
    it('deve chamar o handler correto pela versão no Accept', () => {
      req.get = jest.fn((h) => h === 'Accept' ? 'application/json; version=2.0.0' : 'localhost:3000');
      const handler = jest.fn();
      const handlers = { '2.0.0': handler };
      versionMiddleware.versionedEndpoint(handlers)(req, res, next);
      expect(req.apiVersion).toBe('2.0.0');
      expect(handler).toHaveBeenCalled();
    });
    it('deve chamar o handler correto pela versão na query', () => {
      req.query.version = '3.0.0';
      const handler = jest.fn();
      const handlers = { '3.0.0': handler };
      versionMiddleware.versionedEndpoint(handlers)(req, res, next);
      expect(req.apiVersion).toBe('3.0.0');
      expect(handler).toHaveBeenCalled();
    });
    it('deve usar handler default se versão não encontrada', () => {
      const handler = jest.fn();
      const handlers = { default: handler };
      versionMiddleware.versionedEndpoint(handlers)(req, res, next);
      expect(handler).toHaveBeenCalled();
    });
    it('deve retornar 406 se versão não suportada', () => {
      const handlers = {};
      req.get = jest.fn((h) => h === 'Accept' ? undefined : 'localhost:3000');
      req.query.version = '9.9.9';
      res.status = jest.fn().mockReturnThis();
      versionMiddleware.versionedEndpoint(handlers)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(406);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });
}); 