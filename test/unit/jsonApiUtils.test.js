const jsonApiUtils = require('../../src/utils/jsonApiUtils');

describe('JsonApiUtils', () => {
  describe('formatResource', () => {
    it('deve formatar um recurso corretamente', () => {
      const resource = {
        _id: '123',
        name: 'Test',
        value: 100,
        __v: 0,
        _links: {
          self: { href: '/api/test/123' }
        }
      };

      const result = jsonApiUtils.formatResource(resource, 'test');

      expect(result).toEqual({
        type: 'test',
        id: '123',
        attributes: {
          name: 'Test',
          value: 100
        },
        links: {
          self: '/api/test/123'
        }
      });
    });

    it('deve retornar null para recurso indefinido', () => {
      const result = jsonApiUtils.formatResource(null, 'test');
      expect(result).toBeNull();
    });

    it('deve lidar com recursos sem links', () => {
      const resource = {
        _id: '123',
        name: 'Test'
      };

      const result = jsonApiUtils.formatResource(resource, 'test');

      expect(result).toEqual({
        type: 'test',
        id: '123',
        attributes: {
          name: 'Test'
        },
        links: {
          self: null
        }
      });
    });

    it('deve usar id em vez de _id quando disponível', () => {
      const resource = {
        id: '123',
        name: 'Test'
      };

      const result = jsonApiUtils.formatResource(resource, 'test');

      expect(result.id).toBe('123');
    });
  });

  describe('formatCollection', () => {
    it('deve formatar uma coleção de recursos', () => {
      const resources = [
        { _id: '1', name: 'Test 1' },
        { _id: '2', name: 'Test 2' }
      ];

      const meta = { total: 2 };
      const links = { self: '/api/test' };

      const result = jsonApiUtils.formatCollection(resources, 'test', meta, links);

      expect(result).toEqual({
        jsonapi: { version: '1.0' },
        meta: { total: 2 },
        links: { self: '/api/test' },
        data: [
          {
            type: 'test',
            id: '1',
            attributes: { name: 'Test 1' },
            links: { self: null }
          },
          {
            type: 'test',
            id: '2',
            attributes: { name: 'Test 2' },
            links: { self: null }
          }
        ]
      });
    });

    it('deve formatar uma coleção vazia', () => {
      const result = jsonApiUtils.formatCollection([], 'test');

      expect(result).toEqual({
        jsonapi: { version: '1.0' },
        meta: {},
        links: {},
        data: []
      });
    });
  });

  describe('formatSingleResource', () => {
    it('deve formatar um único recurso', () => {
      const resource = {
        _id: '123',
        name: 'Test',
        _links: {
          self: { href: '/api/test/123' }
        }
      };

      const meta = { timestamp: '2025-05-22' };

      const result = jsonApiUtils.formatSingleResource(resource, 'test', meta);

      expect(result).toEqual({
        jsonapi: { version: '1.0' },
        meta: { timestamp: '2025-05-22' },
        data: {
          type: 'test',
          id: '123',
          attributes: { name: 'Test' },
          links: { self: '/api/test/123' }
        }
      });
    });

    it('deve formatar um recurso sem metadados', () => {
      const resource = {
        _id: '123',
        name: 'Test'
      };

      const result = jsonApiUtils.formatSingleResource(resource, 'test');

      expect(result).toEqual({
        jsonapi: { version: '1.0' },
        meta: {},
        data: {
          type: 'test',
          id: '123',
          attributes: { name: 'Test' },
          links: { self: null }
        }
      });
    });
  });

  describe('formatError', () => {
    it('deve formatar um erro com código', () => {
      const result = jsonApiUtils.formatError(
        'Error Title',
        'Error Detail',
        400,
        'ERR_001'
      );

      expect(result).toEqual({
        jsonapi: { version: '1.0' },
        errors: [
          {
            title: 'Error Title',
            detail: 'Error Detail',
            status: '400',
            code: 'ERR_001'
          }
        ]
      });
    });

    it('deve formatar um erro sem código', () => {
      const result = jsonApiUtils.formatError(
        'Error Title',
        'Error Detail',
        404
      );

      expect(result).toEqual({
        jsonapi: { version: '1.0' },
        errors: [
          {
            title: 'Error Title',
            detail: 'Error Detail',
            status: '404'
          }
        ]
      });
    });
  });
}); 