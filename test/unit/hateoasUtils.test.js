const hateoasUtils = require('../../src/utils/hateoasUtils');

describe('HateoasUtils', () => {
  let mockReq;

  beforeEach(() => {
    mockReq = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000')
    };
  });

  describe('generatePaymentLinks', () => {
    it('deve gerar links para um recurso de pagamento', () => {
      const paymentId = '123';
      const links = hateoasUtils.generatePaymentLinks(paymentId, mockReq);

      expect(links).toEqual([
        {
          rel: 'self',
          href: 'http://localhost:3000/api/payments/123',
          method: 'GET'
        },
        {
          rel: 'cancel',
          href: 'http://localhost:3000/api/payments/123/cancel',
          method: 'POST'
        },
        {
          rel: 'refund',
          href: 'http://localhost:3000/api/payments/123/refund',
          method: 'POST'
        },
        {
          rel: 'payments',
          href: 'http://localhost:3000/api/payments',
          method: 'GET',
          title: 'All Payments'
        },
        {
          rel: 'webhook',
          href: 'http://localhost:3000/api/payments/webhook',
          method: 'POST',
          title: 'Payment Webhook'
        }
      ]);
    });
  });

  describe('generateCollectionLinks', () => {
    it('deve gerar links para uma coleção sem paginação', () => {
      const route = '/api/payments';
      const links = hateoasUtils.generateCollectionLinks(route, mockReq);

      expect(links).toEqual([
        {
          rel: 'self',
          href: 'http://localhost:3000/api/payments',
          method: 'GET'
        },
        {
          rel: 'create',
          href: 'http://localhost:3000/api/payments',
          method: 'POST',
          title: 'Create new resource'
        }
      ]);
    });

    it('deve gerar links para uma coleção com paginação', () => {
      const route = '/api/payments';
      const pagination = {
        page: 2,
        limit: 10,
        totalPages: 5
      };

      const links = hateoasUtils.generateCollectionLinks(route, mockReq, pagination);

      expect(links).toEqual([
        {
          rel: 'self',
          href: 'http://localhost:3000/api/payments',
          method: 'GET'
        },
        {
          rel: 'create',
          href: 'http://localhost:3000/api/payments',
          method: 'POST',
          title: 'Create new resource'
        },
        {
          rel: 'first',
          href: 'http://localhost:3000/api/payments?page=1&limit=10',
          method: 'GET'
        },
        {
          rel: 'prev',
          href: 'http://localhost:3000/api/payments?page=1&limit=10',
          method: 'GET'
        },
        {
          rel: 'next',
          href: 'http://localhost:3000/api/payments?page=3&limit=10',
          method: 'GET'
        },
        {
          rel: 'last',
          href: 'http://localhost:3000/api/payments?page=5&limit=10',
          method: 'GET'
        }
      ]);
    });

    it('não deve incluir link prev na primeira página', () => {
      const route = '/api/payments';
      const pagination = {
        page: 1,
        limit: 10,
        totalPages: 5
      };

      const links = hateoasUtils.generateCollectionLinks(route, mockReq, pagination);
      expect(links.find(link => link.rel === 'prev')).toBeUndefined();
    });

    it('não deve incluir link next na última página', () => {
      const route = '/api/payments';
      const pagination = {
        page: 5,
        limit: 10,
        totalPages: 5
      };

      const links = hateoasUtils.generateCollectionLinks(route, mockReq, pagination);
      expect(links.find(link => link.rel === 'next')).toBeUndefined();
    });
  });

  describe('generateRelationshipLinks', () => {
    it('deve gerar links de relacionamento para um recurso de pagamento', () => {
      const resource = {
        _id: '123',
        userId: 'user456',
        items: [{ id: 'item789' }]
      };

      const relationships = hateoasUtils.generateRelationshipLinks(resource, mockReq);

      expect(relationships).toEqual({
        user: {
          links: {
            self: 'http://localhost:3000/api/users/user456',
            related: 'http://localhost:3000/api/users/user456/payments'
          }
        },
        items: {
          links: {
            self: 'http://localhost:3000/api/payments/123/items'
          }
        }
      });
    });

    it('não deve incluir relacionamentos não existentes', () => {
      const resource = {
        _id: '123'
      };

      const relationships = hateoasUtils.generateRelationshipLinks(resource, mockReq);
      expect(relationships).toEqual({});
    });

    it('deve incluir apenas relacionamentos existentes', () => {
      const resource = {
        _id: '123',
        userId: 'user456',
        items: []
      };

      const relationships = hateoasUtils.generateRelationshipLinks(resource, mockReq);
      expect(relationships).toHaveProperty('user');
      expect(relationships).not.toHaveProperty('items');
    });
  });

  describe('createHateoasResponse', () => {
    it('deve criar uma resposta HATEOAS completa', () => {
      const data = {
        _id: '123',
        orderId: 'order456',
        userId: 'user789',
        items: [{ id: 'item001' }]
      };

      const links = [
        { rel: 'self', href: 'http://localhost:3000/api/payments/123' }
      ];

      const response = hateoasUtils.createHateoasResponse(true, data, links, 'Success', mockReq);

      expect(response).toEqual({
        success: true,
        _links: links,
        data: data,
        message: 'Success',
        _relationships: {
          user: {
            links: {
              self: 'http://localhost:3000/api/users/user789',
              related: 'http://localhost:3000/api/users/user789/payments'
            }
          },
          items: {
            links: {
              self: 'http://localhost:3000/api/payments/123/items'
            }
          }
        },
        _profiles: expect.any(Object)
      });
    });

    it('deve criar uma resposta HATEOAS sem dados', () => {
      const links = [
        { rel: 'self', href: 'http://localhost:3000/api/payments' }
      ];

      const response = hateoasUtils.createHateoasResponse(true, null, links, 'No content');

      expect(response).toEqual({
        success: true,
        _links: links,
        message: 'No content'
      });
    });

    it('deve criar uma resposta HATEOAS para uma coleção', () => {
      const data = [
        { _id: '123', userId: 'user1' },
        { _id: '456', userId: 'user2' }
      ];

      const links = [
        { rel: 'self', href: 'http://localhost:3000/api/payments' }
      ];

      const response = hateoasUtils.createHateoasResponse(true, data, links, null, mockReq);

      expect(response).toEqual({
        success: true,
        _links: links,
        data: data
      });
    });
  });
}); 