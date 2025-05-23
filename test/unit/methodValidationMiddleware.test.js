const { methodValidator, readOnly, fullResource, handlePreflight } = require('../../src/middlewares/methodValidationMiddleware');

describe('methodValidationMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { method: 'GET' };
    res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn(), end: jest.fn() };
    next = jest.fn();
  });

  it('deve permitir métodos válidos', () => {
    methodValidator(['GET', 'POST'])(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('deve bloquear métodos inválidos', () => {
    req.method = 'DELETE';
    methodValidator(['GET', 'POST'])(req, res, next);
    expect(res.set).toHaveBeenCalledWith('Allow', 'GET, POST');
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  it('readOnly deve permitir apenas GET, HEAD, OPTIONS', () => {
    req.method = 'HEAD';
    readOnly()(req, res, next);
    expect(next).toHaveBeenCalled();
    req.method = 'OPTIONS';
    readOnly()(req, res, next);
    expect(next).toHaveBeenCalled();
    req.method = 'POST';
    readOnly()(req, res, next);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('fullResource deve permitir todos os métodos CRUD', () => {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    for (const m of methods) {
      req.method = m;
      fullResource()(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });

  it('handlePreflight deve responder para OPTIONS', () => {
    req.method = 'OPTIONS';
    handlePreflight()(req, res, next);
    expect(res.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('handlePreflight deve chamar next para outros métodos', () => {
    req.method = 'GET';
    handlePreflight()(req, res, next);
    expect(next).toHaveBeenCalled();
  });
}); 