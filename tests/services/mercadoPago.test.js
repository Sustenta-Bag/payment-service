const mercadoPagoService = require('../../src/services/mercadoPago');
const mercadopago = require('mercadopago');

// Mock do módulo mercadopago
jest.mock('mercadopago', () => {
  return {
    configure: jest.fn(),
    preferences: {
      create: jest.fn().mockResolvedValue({
        body: {
          id: 'test-preference-id',
          init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test-preference-id',
          sandbox_init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=test-preference-id'
        }
      })
    },
    payment: {
      get: jest.fn().mockResolvedValue({
        status: 200,
        response: {
          status: 'approved',
          status_detail: 'accredited',
          id: 12345678,
          payment_method_id: 'credit_card',
          payment_type_id: 'credit_card',
          external_reference: 'test-order-id',
          additional_info: {
            items: [
              {
                id: 'test-item-id',
                title: 'Test Product',
                description: 'Test product description',
                quantity: 1,
                unit_price: 100
              }
            ]
          },
          metadata: {
            orderId: 'test-order-id'
          }
        }
      })
    }
  };
});

describe('MercadoPago Service', () => {
  // Preservar console.error original
  let originalConsole;
  
  beforeEach(() => {
    originalConsole = console.error;
    console.error = jest.fn();
  });
  
  afterEach(() => {
    console.error = originalConsole;
    jest.clearAllMocks();
  });

  describe('createPreference', () => {
    it('deve criar uma preferência de pagamento com sucesso', async () => {
      const paymentData = {
        orderId: 'test-order-id',
        items: [
          {
            title: 'Test Product',
            description: 'Test product description',
            quantity: 1,
            unitPrice: 100
          }
        ],
        payer: {
          name: 'Test User',
          email: 'test@example.com'
        },
        callbackUrl: 'https://example.com/callback'
      };

      const result = await mercadoPagoService.createPreference(paymentData);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-preference-id');
      expect(result.init_point).toBeDefined();
      expect(result.sandbox_init_point).toBeDefined();
      expect(mercadopago.preferences.create).toHaveBeenCalled();
    });

    it('deve lidar com erro na criação da preferência', async () => {
      // Force um erro
      mercadopago.preferences.create.mockRejectedValueOnce(new Error('API Error'));

      const paymentData = {
        orderId: 'test-order-id',
        items: [
          {
            title: 'Test Product',
            description: 'Test product description',
            quantity: 1,
            unitPrice: 100
          }
        ],
        payer: {
          name: 'Test User',
          email: 'test@example.com'
        },
        callbackUrl: 'https://example.com/callback'
      };

      await expect(mercadoPagoService.createPreference(paymentData)).rejects.toThrow();
      expect(mercadopago.preferences.create).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('processWebhook', () => {
    it('deve processar um webhook de pagamento com sucesso', async () => {
      const notification = {
        action: 'payment.updated',
        data: {
          id: '12345678'
        }
      };

      const result = await mercadoPagoService.processWebhook(notification);

      expect(result).toBeDefined();
      expect(result.status).toBe('approved');
      expect(result.mercadopagoId).toBe('12345678');
      expect(result.paymentMethod).toBe('credit_card');
      expect(result.metadata.orderId).toBe('test-order-id');
      expect(mercadopago.payment.get).toHaveBeenCalledWith(12345678);
    });

    it('deve retornar null para webhook que não seja de pagamento', async () => {
      const notification = {
        action: 'non_payment_action',
        data: {
          id: '12345678'
        }
      };

      const result = await mercadoPagoService.processWebhook(notification);

      expect(result).toBeNull();
      expect(mercadopago.payment.get).not.toHaveBeenCalled();
    });

    it('deve lidar com erro na obtenção do pagamento', async () => {
      // Force um erro
      mercadopago.payment.get.mockRejectedValueOnce(new Error('API Error'));

      const notification = {
        action: 'payment.updated',
        data: {
          id: '12345678'
        }
      };

      await expect(mercadoPagoService.processWebhook(notification)).rejects.toThrow();
      expect(mercadopago.payment.get).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
