const request = require('supertest');
const app = require('../../src/app');
const Payment = require('../../src/models/payment');

describe('User Payments API', () => {
  let testPayments = [];

  beforeEach(async () => {
    // Limpa a coleção e cria pagamentos de teste
    await Payment.deleteMany({});
    
    const paymentData = [
      {
        orderId: 'order001',
        userId: 'user123',
        amount: 100.00,
        status: 'pending',
        items: [{ title: 'Item 1', quantity: 1, unitPrice: 100.00 }],
        createdAt: new Date('2024-01-15T10:00:00Z')
      },
      {
        orderId: 'order002',
        userId: 'user123',
        amount: 200.00,
        status: 'approved',
        items: [{ title: 'Item 2', quantity: 2, unitPrice: 100.00 }],
        createdAt: new Date('2024-01-20T10:00:00Z')
      },
      {
        orderId: 'order003',
        userId: 'user123',
        amount: 150.00,
        status: 'rejected',
        items: [{ title: 'Item 3', quantity: 1, unitPrice: 150.00 }],
        createdAt: new Date('2024-01-25T10:00:00Z')
      },
      {
        orderId: 'order004',
        userId: 'user456',
        amount: 300.00,
        status: 'approved',
        items: [{ title: 'Item 4', quantity: 3, unitPrice: 100.00 }],
        createdAt: new Date('2024-01-30T10:00:00Z')
      }
    ];

    testPayments = await Payment.insertMany(paymentData);
  });

  afterEach(async () => {
    await Payment.deleteMany({});
  });

  describe('GET /api/payments/user/:userId', () => {
    it('deve retornar todos os pagamentos de um usuário', async () => {
      const response = await request(app)
        .get('/api/payments/user/user123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.message).toContain('3 pagamentos encontrados');
      expect(response.body._meta.pagination).toBeDefined();
      expect(response.body._meta.stats).toBeDefined();
      expect(response.body._links).toBeDefined();
    });

    it('deve filtrar pagamentos por status', async () => {
      const response = await request(app)
        .get('/api/payments/user/user123?status=approved')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].data.status).toBe('approved');
    });

    it('deve filtrar pagamentos por data', async () => {
      const response = await request(app)
        .get('/api/payments/user/user123?startDate=2024-01-20&endDate=2024-01-25')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('deve aplicar paginação corretamente', async () => {
      const response = await request(app)
        .get('/api/payments/user/user123?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body._meta.pagination.page).toBe(1);
      expect(response.body._meta.pagination.limit).toBe(2);
      expect(response.body._meta.pagination.total).toBe(3);
      expect(response.body._meta.pagination.hasNext).toBe(true);
    });

    it('deve retornar erro 404 quando usuário não tem pagamentos', async () => {
      const response = await request(app)
        .get('/api/payments/user/user_inexistente')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Nenhum pagamento encontrado');
    });

    it('deve retornar erro 400 para status inválido', async () => {
      const response = await request(app)
        .get('/api/payments/user/user123?status=invalid_status')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Status inválido');
    });

    it('deve retornar erro 400 para data inválida', async () => {
      const response = await request(app)
        .get('/api/payments/user/user123?startDate=invalid_date')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Data inicial inválida');
    });

    it('deve incluir links HATEOAS corretos', async () => {
      const response = await request(app)
        .get('/api/payments/user/user123')
        .expect(200);

      expect(response.body._links).toBeDefined();
      const links = response.body._links;
      
      // Verifica se tem links de filtros por status
      const statusLinks = links.filter(link => link.rel.startsWith('filter-'));
      expect(statusLinks.length).toBeGreaterThan(0);
      
      // Verifica link self
      const selfLink = links.find(link => link.rel === 'self');
      expect(selfLink).toBeDefined();
      
      // Verifica link all-payments
      const allPaymentsLink = links.find(link => link.rel === 'all-payments');
      expect(allPaymentsLink).toBeDefined();
    });

    it('deve incluir estatísticas por status', async () => {
      const response = await request(app)
        .get('/api/payments/user/user123')
        .expect(200);

      expect(response.body._meta.stats).toBeDefined();
      const stats = response.body._meta.stats;
      
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(1);
      expect(stats.rejected).toBe(1);
    });

    it('deve incluir informações de filtros aplicados', async () => {
      const response = await request(app)
        .get('/api/payments/user/user123?status=approved&startDate=2024-01-01&endDate=2024-01-31')
        .expect(200);

      expect(response.body._meta.filters).toBeDefined();
      const filters = response.body._meta.filters;
      
      expect(filters.status).toBe('approved');
      expect(filters.startDate).toBe('2024-01-01');
      expect(filters.endDate).toBe('2024-01-31');
    });

    it('deve combinar múltiplos filtros corretamente', async () => {
      const response = await request(app)
        .get('/api/payments/user/user123?status=approved&startDate=2024-01-19&endDate=2024-01-21')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].data.status).toBe('approved');
      expect(response.body.data[0].data.orderId).toBe('order002');
    });

    it('deve incluir links de paginação quando há próxima página', async () => {
      const response = await request(app)
        .get('/api/payments/user/user123?page=1&limit=1')
        .expect(200);

      expect(response.body._links).toBeDefined();
      const nextLink = response.body._links.find(link => link.rel === 'next');
      expect(nextLink).toBeDefined();
      expect(nextLink.href).toContain('page=2');
    });

    it('deve incluir links de paginação quando há página anterior', async () => {
      const response = await request(app)
        .get('/api/payments/user/user123?page=2&limit=2')
        .expect(200);

      expect(response.body._links).toBeDefined();
      const prevLink = response.body._links.find(link => link.rel === 'prev');
      expect(prevLink).toBeDefined();
      expect(prevLink.href).toContain('page=1');
    });
  });
});
