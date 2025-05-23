const profileUtils = require('../../src/utils/profileUtils');

describe('ProfileUtils', () => {
  let mockReq;

  beforeEach(() => {
    mockReq = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000')
    };
  });

  describe('generateResourceProfiles', () => {
    it('deve gerar profiles para tipo payment', () => {
      const result = profileUtils.generateResourceProfiles('payment', mockReq);

      expect(result).toEqual({
        documentation: 'http://localhost:3000/api-docs',
        schema: 'http://localhost:3000/profiles/payment/schema',
        resource: 'http://localhost:3000/profiles/payment',
        collection: 'http://localhost:3000/profiles/payments'
      });
    });

    it('deve gerar profiles para tipo user', () => {
      const result = profileUtils.generateResourceProfiles('user', mockReq);

      expect(result).toEqual({
        documentation: 'http://localhost:3000/api-docs',
        schema: 'http://localhost:3000/profiles/user/schema',
        resource: 'http://localhost:3000/profiles/user',
        collection: 'http://localhost:3000/profiles/users'
      });
    });

    it('deve gerar profiles para tipo personalizado', () => {
      const result = profileUtils.generateResourceProfiles('custom', mockReq);

      expect(result).toEqual({
        documentation: 'http://localhost:3000/api-docs',
        schema: 'http://localhost:3000/profiles/custom/schema',
        resource: 'http://localhost:3000/profiles/custom',
        collection: 'http://localhost:3000/profiles/customs'
      });
    });

    it('deve usar protocolo e host corretos', () => {
      mockReq.protocol = 'https';
      mockReq.get.mockReturnValue('api.example.com');

      const result = profileUtils.generateResourceProfiles('payment', mockReq);

      expect(result.documentation).toBe('https://api.example.com/api-docs');
      expect(result.schema).toBe('https://api.example.com/profiles/payment/schema');
    });
  });

  describe('getProfileLink', () => {
    it('deve retornar link do profile do recurso', () => {
      const result = profileUtils.getProfileLink('payment', mockReq);
      expect(result).toBe('http://localhost:3000/profiles/payment');
    });

    it('deve retornar link do profile para tipo personalizado', () => {
      const result = profileUtils.getProfileLink('custom', mockReq);
      expect(result).toBe('http://localhost:3000/profiles/custom');
    });
  });

  describe('addProfilesToHateoas', () => {
    it('deve adicionar profiles a um objeto HATEOAS', () => {
      const hateoasObject = {
        _links: {
          self: { href: '/api/payments/123' }
        }
      };

      const result = profileUtils.addProfilesToHateoas(hateoasObject, 'payment', mockReq);

      expect(result).toEqual({
        _links: {
          self: { href: '/api/payments/123' }
        },
        _profiles: {
          documentation: 'http://localhost:3000/api-docs',
          schema: 'http://localhost:3000/profiles/payment/schema',
          resource: 'http://localhost:3000/profiles/payment',
          collection: 'http://localhost:3000/profiles/payments'
        }
      });
    });

    it('deve retornar o mesmo objeto se o input for null', () => {
      const result = profileUtils.addProfilesToHateoas(null, 'payment', mockReq);
      expect(result).toBeNull();
    });

    it('deve retornar o mesmo objeto se o input for undefined', () => {
      const result = profileUtils.addProfilesToHateoas(undefined, 'payment', mockReq);
      expect(result).toBeUndefined();
    });
  });
}); 