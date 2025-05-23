const paymentSimulationService = require('../../src/services/paymentSimulation');

describe('PaymentSimulationService', () => {
  const mockPaymentData = {
    orderId: 'order123',
    userId: 'user123',
    items: [
      {
        title: 'Produto 1',
        description: 'Descrição do produto 1',
        quantity: 2,
        unitPrice: 100
      }
    ],
    currency: 'BRL',
    payer: {
      name: 'João Silva',
      email: 'joao@email.com'
    },
    callbackUrl: 'https://seu-site.com/checkout'
  };

  describe('createPaymentIntent', () => {
    it('deve criar uma intenção de pagamento com sucesso', async () => {
      const result = await paymentSimulationService.createPaymentIntent(mockPaymentData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('init_point');
      expect(result).toHaveProperty('external_reference', mockPaymentData.orderId);
      expect(result).toHaveProperty('total_amount', 200);
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('payer');
      expect(result).toHaveProperty('created_at');
    });

    it('deve falhar ao criar intenção de pagamento com dados inválidos', async () => {
      const invalidData = { ...mockPaymentData };
      delete invalidData.items;

      await expect(
        paymentSimulationService.createPaymentIntent(invalidData)
      ).rejects.toThrow('Erro ao criar simulação de pagamento');
    });
  });

  describe('getPaymentStatus', () => {
    it('deve retornar status de pagamento válido', async () => {
      const paymentId = 'payment123';
      const result = await paymentSimulationService.getPaymentStatus(paymentId);

      expect(result).toHaveProperty('id', paymentId);
      expect(result).toHaveProperty('status');
      expect(['approved', 'pending', 'rejected']).toContain(result.status);
      expect(result).toHaveProperty('payment_method_id');
      expect(result).toHaveProperty('date_approved');
      expect(result).toHaveProperty('date_created');
    });
  });

  describe('processPaymentNotification', () => {
    it('deve processar notificação de pagamento com sucesso', async () => {
      const mockNotification = {
        type: 'payment',
        data: {
          id: 'payment123',
          orderId: 'order123',
          userId: 'user123'
        }
      };

      const result = await paymentSimulationService.processPaymentNotification(mockNotification);

      expect(result).toHaveProperty('paymentId');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('paymentMethod');
      expect(result.metadata).toHaveProperty('orderId', mockNotification.data.orderId);
    });

    it('deve retornar null para notificação não relacionada a pagamento', async () => {
      const mockNotification = {
        type: 'other',
        data: {}
      };

      const result = await paymentSimulationService.processPaymentNotification(mockNotification);
      expect(result).toBeNull();
    });
  });

  describe('approvePayment', () => {
    it('deve aprovar pagamento com sucesso', async () => {
      const orderId = 'order123';
      const result = await paymentSimulationService.approvePayment(orderId);

      expect(result).toHaveProperty('paymentId');
      expect(result).toHaveProperty('status', 'approved');
      expect(result).toHaveProperty('paymentMethod', 'credit_card');
      expect(result.metadata).toHaveProperty('orderId', orderId);
    });
  });

  describe('rejectPayment', () => {
    it('deve rejeitar pagamento com sucesso', async () => {
      const orderId = 'order123';
      const result = await paymentSimulationService.rejectPayment(orderId);

      expect(result).toHaveProperty('paymentId');
      expect(result).toHaveProperty('status', 'rejected');
      expect(result).toHaveProperty('paymentMethod', 'credit_card');
      expect(result.metadata).toHaveProperty('orderId', orderId);
    });
  });

  describe('cancelPayment', () => {
    it('deve cancelar pagamento com sucesso', async () => {
      const paymentId = 'payment123';
      const result = await paymentSimulationService.cancelPayment(paymentId);

      expect(result).toHaveProperty('id', paymentId);
      expect(result).toHaveProperty('status', 'cancelled');
      expect(result).toHaveProperty('cancelled_at');
      expect(result).toHaveProperty('message');
    });
  });

  describe('refundPayment', () => {
    it('deve reembolsar pagamento com sucesso', async () => {
      const paymentId = 'payment123';
      const result = await paymentSimulationService.refundPayment(paymentId);

      expect(result).toHaveProperty('id', paymentId);
      expect(result).toHaveProperty('status', 'refunded');
      expect(result).toHaveProperty('refunded_at');
      expect(result).toHaveProperty('message');
    });
  });
}); 