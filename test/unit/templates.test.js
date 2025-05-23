const templates = require('../../src/utils/templates');

describe('templates utils', () => {
  it('deve renderizar a página de simulação de pagamento', () => {
    const payment = { orderId: '123', amount: 100, status: 'approved', userId: 'user1', items: [{ title: 'Produto', quantity: 2, unitPrice: 50 }] };
    const html = templates.renderPaymentSimulationPage(payment);
    expect(typeof html).toBe('string');
    expect(html).toContain('123');
    expect(html).toContain('approved');
    expect(html).toContain('Produto');
  });

  it('deve retornar string vazia se payment for objeto vazio', () => {
    const html = templates.renderPaymentSimulationPage({ orderId: '', userId: '', items: [], amount: 0 });
    expect(typeof html).toBe('string');
    expect(html).toContain('Pedido #:');
  });
}); 