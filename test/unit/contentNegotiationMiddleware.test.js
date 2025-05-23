const { contentNegotiation } = require('../../src/middlewares/contentNegotiationMiddleware');

describe('contentNegotiationMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, path: '/payments/123', protocol: 'http', get: jest.fn().mockReturnValue('localhost:3000') };
    res = {
      set: jest.fn(),
      json: jest.fn(function (body) { return body; })
    };
    next = jest.fn();
  });

  it('deve chamar next e definir Content-Type padrão', () => {
    contentNegotiation()(req, res, next);
    res.json({ test: true });
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(next).toHaveBeenCalled();
  });

  it('deve definir Content-Type para application/vnd.api+json', () => {
    req.headers.accept = 'application/vnd.api+json';
    contentNegotiation()(req, res, next);
    res.json({ success: true, data: { id: 1 } });
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/vnd.api+json');
  });

  it('deve definir Content-Type para application/hal+json', () => {
    req.headers.accept = 'application/hal+json';
    contentNegotiation()(req, res, next);
    res.json({ success: true, data: { id: 1 } });
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/hal+json');
  });

  it('deve definir header de profile quando resourceType for payment', () => {
    contentNegotiation()(req, res, next);
    expect(res.set).toHaveBeenCalledWith('Link', expect.stringContaining('profile'));
  });

  it('deve formatar erro em JSON:API', () => {
    req.headers.accept = 'application/vnd.api+json';
    contentNegotiation()(req, res, next);
    res.statusCode = 400;
    const result = res.json({ success: false, message: 'Erro', error: 'Detalhe' });
    expect(result.errors).toBeDefined();
    expect(result.errors[0].title).toBe('Erro');
  });
}); 