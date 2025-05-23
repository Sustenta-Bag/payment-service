const cacheMiddleware = require('../../src/middlewares/cacheMiddleware');
const crypto = require('crypto');

describe('cacheMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { method: 'GET', headers: {} };
    res = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      end: jest.fn()
    };
    next = jest.fn();
  });

  describe('setCacheHeaders', () => {
    it('deve definir headers para GET', () => {
      cacheMiddleware.setCacheHeaders(120)(req, res, next);
      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=120');
      expect(res.set).toHaveBeenCalledWith('Expires', expect.any(String));
      expect(next).toHaveBeenCalled();
    });
    it('deve definir headers para métodos de modificação', () => {
      req.method = 'POST';
      cacheMiddleware.setCacheHeaders()(req, res, next);
      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      expect(res.set).toHaveBeenCalledWith('Pragma', 'no-cache');
      expect(res.set).toHaveBeenCalledWith('Expires', '0');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('setEtagHeader', () => {
    it('deve definir ETag e retornar 304 se igual', () => {
      const body = JSON.stringify({ test: 1 });
      const etag = crypto.createHash('md5').update(body).digest('hex');
      req.headers['if-none-match'] = `"${etag}"`;
      let statusSet = false;
      res.status = jest.fn().mockImplementation((code) => { statusSet = code; return res; });
      res.send = jest.fn();
      cacheMiddleware.setEtagHeader()(req, res, next);
      res.send(body);
      expect(res.set).toHaveBeenCalledWith('ETag', `"${etag}"`);
      expect(statusSet).toBe(304);
    });
    it('deve definir ETag e enviar body normalmente se não igual', () => {
      const body = JSON.stringify({ test: 2 });
      req.headers['if-none-match'] = '"outro-etag"';
      res.send = jest.fn();
      cacheMiddleware.setEtagHeader()(req, res, next);
      res.send(body);
      expect(res.set).toHaveBeenCalledWith('ETag', expect.any(String));
    });
  });

  describe('setLastModifiedHeader', () => {
    it('deve definir Last-Modified e retornar 304 se não modificado', async () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      req.headers['if-modified-since'] = date.toUTCString();
      res.set = jest.fn();
      res.status = jest.fn().mockReturnThis();
      res.end = jest.fn();
      const getLastModifiedDate = jest.fn().mockResolvedValue(date);
      const next = jest.fn();
      await cacheMiddleware.setLastModifiedHeader(getLastModifiedDate)(req, res, next);
      expect(res.set).toHaveBeenCalledWith('Last-Modified', date.toUTCString());
      expect(res.status).toHaveBeenCalledWith(304);
      expect(res.end).toHaveBeenCalled();
    });
    it('deve definir Last-Modified e chamar next se modificado', async () => {
      const date = new Date();
      req.headers['if-modified-since'] = new Date(date.getTime() - 10000).toUTCString();
      res.set = jest.fn();
      const getLastModifiedDate = jest.fn().mockResolvedValue(date);
      const next = jest.fn();
      await cacheMiddleware.setLastModifiedHeader(getLastModifiedDate)(req, res, next);
      expect(res.set).toHaveBeenCalledWith('Last-Modified', date.toUTCString());
      expect(next).toHaveBeenCalled();
    });
    it('deve chamar next em caso de erro', async () => {
      const getLastModifiedDate = jest.fn().mockRejectedValue(new Error('fail'));
      const next = jest.fn();
      await cacheMiddleware.setLastModifiedHeader(getLastModifiedDate)(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
}); 