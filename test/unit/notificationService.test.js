const notificationService = require('../../src/services/notificationService');
const rabbitMQService = require('../../src/services/rabbitMQ');
const monolithClient = require('../../src/services/monolithClient');
const config = require('../../src/config/config');

jest.mock('../../src/services/rabbitMQ');
jest.mock('../../src/services/monolithClient');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    monolithClient.getUserFcmToken.mockResolvedValue('mock-fcm-token');
    rabbitMQService.publish.mockResolvedValue(true);
  });

  const mockPayment = {
    _id: 'payment123',
    orderId: 'order123',
    userId: 'user123',
    amount: 200,
    items: [
      {
        title: 'Produto 1',
        quantity: 2,
        unitPrice: 100
      }
    ]
  };

  describe('sendNotification', () => {
    it('deve enviar notificação com sucesso', async () => {
      const result = await notificationService.sendNotification(
        'user123',
        'Teste',
        'Mensagem de teste',
        { data: 'test' }
      );

      expect(result).toBe(true);
      expect(monolithClient.getUserFcmToken).toHaveBeenCalledWith('user123');
      expect(rabbitMQService.publish).toHaveBeenCalledWith(
        config.rabbitmq.exchanges.notifications,
        'notification',
        expect.objectContaining({
          to: 'mock-fcm-token',
          notification: {
            title: 'Teste',
            body: 'Mensagem de teste'
          },
          data: { data: 'test' }
        })
      );
    });

    it('deve retornar false quando token FCM não for encontrado', async () => {
      monolithClient.getUserFcmToken.mockResolvedValue(null);

      const result = await notificationService.sendNotification(
        'user123',
        'Teste',
        'Mensagem de teste'
      );

      expect(result).toBe(false);
      expect(rabbitMQService.publish).not.toHaveBeenCalled();
    });

    it('deve retornar false em caso de erro', async () => {
      monolithClient.getUserFcmToken.mockRejectedValue(new Error('Erro de teste'));

      const result = await notificationService.sendNotification(
        'user123',
        'Teste',
        'Mensagem de teste'
      );

      expect(result).toBe(false);
      expect(rabbitMQService.publish).not.toHaveBeenCalled();
    });
  });

  describe('sendPaymentNotification', () => {
    it('deve enviar notificação de pagamento aprovado', async () => {
      const result = await notificationService.sendPaymentNotification(
        mockPayment.userId,
        'approved',
        mockPayment
      );

      expect(result).toBe(true);
      expect(monolithClient.getUserFcmToken).toHaveBeenCalledWith(mockPayment.userId);
      expect(rabbitMQService.publish).toHaveBeenCalledWith(
        config.rabbitmq.exchanges.notifications,
        'notification',
        expect.objectContaining({
          notification: {
            title: 'Pagamento aprovado',
            body: expect.stringContaining('200.00')
          },
          data: expect.objectContaining({
            paymentId: mockPayment._id.toString(),
            orderId: mockPayment.orderId,
            status: 'approved'
          })
        })
      );
    });

    it('deve enviar notificação de pagamento rejeitado', async () => {
      const result = await notificationService.sendPaymentNotification(
        mockPayment.userId,
        'rejected',
        mockPayment
      );

      expect(result).toBe(true);
      expect(rabbitMQService.publish).toHaveBeenCalledWith(
        config.rabbitmq.exchanges.notifications,
        'notification',
        expect.objectContaining({
          notification: {
            title: 'Pagamento recusado',
            body: expect.stringContaining('200.00')
          },
          data: expect.objectContaining({
            status: 'rejected'
          })
        })
      );
    });

    it('deve enviar notificação com status personalizado', async () => {
      const result = await notificationService.sendPaymentNotification(
        mockPayment.userId,
        'pending',
        mockPayment
      );

      expect(result).toBe(true);
      expect(rabbitMQService.publish).toHaveBeenCalledWith(
        config.rabbitmq.exchanges.notifications,
        'notification',
        expect.objectContaining({
          notification: {
            title: 'Atualização de pagamento',
            body: expect.stringContaining('pending')
          }
        })
      );
    });

    it('deve retornar false quando não conseguir enviar a notificação', async () => {
      rabbitMQService.publish.mockResolvedValue(false);

      const result = await notificationService.sendPaymentNotification(
        mockPayment.userId,
        'approved',
        mockPayment
      );

      expect(result).toBe(false);
    });
  });
}); 