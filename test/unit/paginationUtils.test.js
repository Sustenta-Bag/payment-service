const paginationUtils = require('../../src/utils/paginationUtils');

describe('PaginationUtils', () => {
  describe('getPaginationInfo', () => {
    it('deve gerar informações de paginação corretamente', () => {
      const options = {
        totalItems: 100,
        page: 2,
        limit: 10,
        baseUrl: '/api/items'
      };

      const result = paginationUtils.getPaginationInfo(options);

      expect(result._meta).toEqual({
        totalItems: 100,
        itemsPerPage: 10,
        currentPage: 2,
        totalPages: 10
      });

      expect(result._links).toEqual({
        self: { href: '/api/items?page=2&limit=10' },
        first: { href: '/api/items?page=1&limit=10' },
        last: { href: '/api/items?page=10&limit=10' },
        prev: { href: '/api/items?page=1&limit=10' },
        next: { href: '/api/items?page=3&limit=10' }
      });
    });

    it('deve usar valores padrão quando não fornecidos', () => {
      const options = {
        totalItems: 100,
        baseUrl: '/api/items'
      };

      const result = paginationUtils.getPaginationInfo(options);

      expect(result._meta).toEqual({
        totalItems: 100,
        itemsPerPage: 10,
        currentPage: 1,
        totalPages: 10
      });
    });

    it('não deve incluir link prev na primeira página', () => {
      const options = {
        totalItems: 100,
        page: 1,
        limit: 10,
        baseUrl: '/api/items'
      };

      const result = paginationUtils.getPaginationInfo(options);
      expect(result._links.prev).toBeUndefined();
    });

    it('não deve incluir link next na última página', () => {
      const options = {
        totalItems: 100,
        page: 10,
        limit: 10,
        baseUrl: '/api/items'
      };

      const result = paginationUtils.getPaginationInfo(options);
      expect(result._links.next).toBeUndefined();
    });
  });

  describe('getLinkHeader', () => {
    it('deve gerar header de link corretamente', () => {
      const paginationInfo = {
        _links: {
          self: { href: '/api/items?page=2&limit=10' },
          first: { href: '/api/items?page=1&limit=10' },
          last: { href: '/api/items?page=10&limit=10' },
          prev: { href: '/api/items?page=1&limit=10' },
          next: { href: '/api/items?page=3&limit=10' }
        }
      };

      const result = paginationUtils.getLinkHeader(paginationInfo);

      expect(result).toBe(
        '</api/items?page=1&limit=10>; rel="first", ' +
        '</api/items?page=10&limit=10>; rel="last", ' +
        '</api/items?page=1&limit=10>; rel="prev", ' +
        '</api/items?page=3&limit=10>; rel="next"'
      );
    });

    it('deve omitir o link self do header', () => {
      const paginationInfo = {
        _links: {
          self: { href: '/api/items?page=1&limit=10' },
          next: { href: '/api/items?page=2&limit=10' }
        }
      };

      const result = paginationUtils.getLinkHeader(paginationInfo);
      expect(result).toBe('</api/items?page=2&limit=10>; rel="next"');
    });

    it('deve retornar string vazia quando não houver links', () => {
      const paginationInfo = {
        _links: {
          self: { href: '/api/items?page=1&limit=10' }
        }
      };

      const result = paginationUtils.getLinkHeader(paginationInfo);
      expect(result).toBe('');
    });
  });

  describe('paginateCollection', () => {
    const collection = Array.from({ length: 100 }, (_, i) => i + 1);

    it('deve paginar uma coleção corretamente', () => {
      const result = paginationUtils.paginateCollection(collection, 2, 10);
      expect(result).toHaveLength(10);
      expect(result[0]).toBe(11);
      expect(result[9]).toBe(20);
    });

    it('deve usar valores padrão quando não fornecidos', () => {
      const result = paginationUtils.paginateCollection(collection);
      expect(result).toHaveLength(10);
      expect(result[0]).toBe(1);
      expect(result[9]).toBe(10);
    });

    it('deve retornar página parcial no final', () => {
      const result = paginationUtils.paginateCollection(collection, 7, 15);
      expect(result).toHaveLength(10); // 100 itens, página 7 com 15 itens por página
      expect(result[0]).toBe(91);
      expect(result[9]).toBe(100);
    });

    it('deve retornar array vazio para página fora do intervalo', () => {
      const result = paginationUtils.paginateCollection(collection, 11, 10);
      expect(result).toHaveLength(0);
    });
  });
}); 