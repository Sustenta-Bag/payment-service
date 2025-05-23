const request = require('supertest');
const app = require('../../src/app');
const path = require('path');
const fs = require('fs').promises;

describe('Profile Routes', () => {
  describe('GET /profiles/:type', () => {
    it('deve retornar o markdown do profile se existir', async () => {
      const res = await request(app).get('/profiles/payment');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/markdown');
      expect(res.text).toContain('#'); // Deve conter algum markdown
    });

    it('deve retornar 404 se profile não existir', async () => {
      const res = await request(app).get('/profiles/inexistente');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /profiles/:type/schema', () => {
    it('deve retornar o schema JSON se existir', async () => {
      const res = await request(app).get('/profiles/payment/schema');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/schema+json');
      expect(res.headers['link']).toContain('/profiles/payment');
      expect(() => JSON.parse(res.text)).not.toThrow();
    });

    it('deve retornar 404 se schema não existir', async () => {
      const res = await request(app).get('/profiles/inexistente/schema');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });
}); 