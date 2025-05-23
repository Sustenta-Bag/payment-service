const paginationMiddleware = require('../../src/middlewares/paginationMiddleware');

describe('paginationMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn()
    };
    next = jest.fn();
  });

  it('deve adicionar paginação padrão ao request', () => {
    paginationMiddleware(req, res, next);
    expect(req.pagination).toEqual({ page: 1, limit: 10, offset: 0 });
    expect(next).toHaveBeenCalled();
  });

  it('deve adicionar paginação customizada ao request', () => {
    req.query = { page: '2', limit: '5' };
    paginationMiddleware(req, res, next);
    expect(req.pagination).toEqual({ page: 2, limit: 5, offset: 5 });
    expect(next).toHaveBeenCalled();
  });

  it('deve retornar 400 para parâmetros inválidos', () => {
    req.query = { page: '0', limit: '200' };
    paginationMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    expect(next).not.toHaveBeenCalled();
  });

  it('deve definir headers de paginação', () => {
    const paginationInfo = {
      _meta: { currentPage: 1, itemsPerPage: 10, totalItems: 100, totalPages: 10 },
      _links: {}
    };
    res.set = jest.fn();
    res.setPaginationHeaders = null;
    paginationMiddleware(req, res, next);
    res.setPaginationHeaders(paginationInfo);
    expect(res.set).toHaveBeenCalledWith('X-Pagination-Page', 1);
    expect(res.set).toHaveBeenCalledWith('X-Pagination-Limit', 10);
    expect(res.set).toHaveBeenCalledWith('X-Pagination-Total', 100);
    expect(res.set).toHaveBeenCalledWith('X-Pagination-Pages', 10);
  });
}); 