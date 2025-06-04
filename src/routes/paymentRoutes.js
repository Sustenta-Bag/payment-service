const express = require("express");
const paymentController = require("../controllers/paymentController");
const cacheMiddleware = require("../middlewares/cacheMiddleware");
const methodValidation = require("../middlewares/methodValidationMiddleware");
const Payment = require("../models/payment");
const router = express.Router();

router.use(methodValidation.handlePreflight());

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Cria um novo pagamento
 *     tags: [Pagamentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - items
 *               - payer
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID do usuário
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       description: Título do item
 *                     description:
 *                       type: string
 *                       description: Descrição do item
 *                     quantity:
 *                       type: integer
 *                       description: Quantidade do item
 *                     unitPrice:
 *                       type: number
 *                       description: Preço unitário do item
 *               payer:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     description: Email do pagador
 *                   name:
 *                     type: string
 *                     description: Nome do pagador
 *                   identification:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         description: Tipo de documento
 *                       number:
 *                         type: string
 *                         description: Número do documento
 *               callbackUrl:
 *                 type: string
 *                 description: URL de retorno após o pagamento
 *     responses:
 *       201:
 *         description: Pagamento criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/",
  methodValidation.methodValidator(["POST"]),
  paymentController.createPayment
  /*  #swagger.tags = ['Pagamentos']
      #swagger.summary = 'Cria um novo pagamento'
      #swagger.description = 'Cria um novo pagamento no sistema com items e informações do pagador'
      #swagger.parameters['body'] = {
        in: 'body',
        description: 'Dados do pagamento',
        required: true,
        schema: {
          $ref: '#/definitions/CreatePaymentRequest'
        }
      }
      #swagger.responses[201] = {
        description: 'Pagamento criado com sucesso',
        schema: {
          $ref: '#/definitions/PaymentResponse'
        }
      }
      #swagger.responses[400] = {
        description: 'Dados inválidos ou incompletos',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
      #swagger.responses[500] = {
        description: 'Erro interno do servidor',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
  */
);
/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Obtém informações de um pagamento por ID
 *     tags: [Pagamentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pagamento
 *     responses:
 *       200:
 *         description: Informações do pagamento
 *       404:
 *         description: Pagamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/:id",
  methodValidation.methodValidator(["GET", "HEAD", "OPTIONS"]),
  cacheMiddleware.setCacheHeaders(60),
  cacheMiddleware.setEtagHeader(),
  cacheMiddleware.setLastModifiedHeader(async (req) => {
    const payment = await Payment.findById(req.params.id);
    return payment ? payment.updatedAt || payment.createdAt : null;
  }),
  paymentController.getPayment
  /*  #swagger.tags = ['Pagamentos']
      #swagger.summary = 'Obtém informações de um pagamento por ID'
      #swagger.description = 'Busca um pagamento específico pelo seu ID único'
      #swagger.parameters['id'] = {
        in: 'path',
        description: 'ID único do pagamento',
        required: true,
        type: 'string',
        example: '507f1f77bcf86cd799439011'
      }
      #swagger.responses[200] = {
        description: 'Informações do pagamento encontrado',
        schema: {
          $ref: '#/definitions/PaymentResponse'
        }
      }
      #swagger.responses[404] = {
        description: 'Pagamento não encontrado',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
      #swagger.responses[500] = {
        description: 'Erro interno do servidor',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
  */
);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Lista todos os pagamentos com paginação
 *     tags: [Pagamentos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de pagamentos
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/",
  methodValidation.methodValidator(["GET", "HEAD", "OPTIONS"]),
  cacheMiddleware.setCacheHeaders(30),
  cacheMiddleware.setEtagHeader(),
  paymentController.listPayments
  /*  #swagger.tags = ['Pagamentos']
      #swagger.summary = 'Lista todos os pagamentos com paginação'
      #swagger.description = 'Obtém uma lista paginada de todos os pagamentos do sistema'
      #swagger.parameters['page'] = {
        in: 'query',
        description: 'Número da página para paginação',
        required: false,
        type: 'integer',
        example: 1
      }
      #swagger.parameters['limit'] = {
        in: 'query',
        description: 'Quantidade de itens por página',
        required: false,
        type: 'integer',
        example: 10
      }
      #swagger.responses[200] = {
        description: 'Lista de pagamentos com paginação',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                payments: {
                  type: 'array',
                  items: { $ref: '#/definitions/PaymentResponse' }
                },
                _meta: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 10 },
                    total: { type: 'integer', example: 100 },
                    totalPages: { type: 'integer', example: 10 }
                  }
                }
              }
            },
            _links: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rel: { type: 'string', example: 'next' },
                  href: { type: 'string', example: '/api/payments?page=2&limit=10' },
                  method: { type: 'string', example: 'GET' }
                }
              }
            }
          }
        }
      }
      #swagger.responses[500] = {
        description: 'Erro interno do servidor',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
  */
);

/**
 * @swagger
 * /api/payments/{id}/cancel:
 *   post:
 *     summary: Cancela um pagamento
 *     tags: [Pagamentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pagamento
 *     responses:
 *       200:
 *         description: Pagamento cancelado com sucesso
 *       404:
 *         description: Pagamento não encontrado
 *       400:
 *         description: Pagamento não pode ser cancelado
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/:id/cancel",
  methodValidation.methodValidator(["POST"]),
  paymentController.cancelPayment
  /*  #swagger.tags = ['Pagamentos']
      #swagger.summary = 'Cancela um pagamento'
      #swagger.description = 'Cancela um pagamento que está em status pending'
      #swagger.parameters['id'] = {
        in: 'path',
        description: 'ID único do pagamento a ser cancelado',
        required: true,
        type: 'string',
        example: '507f1f77bcf86cd799439011'
      }
      #swagger.responses[200] = {
        description: 'Pagamento cancelado com sucesso',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                paymentId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                orderId: { type: 'string', example: 'order456' },
                status: { type: 'string', example: 'cancelled' }
              }
            },
            message: { type: 'string', example: 'Pagamento cancelado com sucesso' },
            _links: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rel: { type: 'string', example: 'self' },
                  href: { type: 'string', example: '/api/payments/507f1f77bcf86cd799439011' },
                  method: { type: 'string', example: 'GET' }
                }
              }
            }
          }
        }
      }
      #swagger.responses[400] = {
        description: 'Pagamento não pode ser cancelado (status inválido)',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
      #swagger.responses[404] = {
        description: 'Pagamento não encontrado',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
      #swagger.responses[500] = {
        description: 'Erro interno do servidor',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
  */
);

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     summary: Reembolsa um pagamento
 *     tags: [Pagamentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pagamento
 *     responses:
 *       200:
 *         description: Pagamento reembolsado com sucesso
 *       404:
 *         description: Pagamento não encontrado
 *       400:
 *         description: Pagamento não pode ser reembolsado
 *       500:
 *         description: Erro interno do servidor
 */
router.post(
  "/:id/refund",
  methodValidation.methodValidator(["POST"]),
  paymentController.refundPayment
  /*  #swagger.tags = ['Pagamentos']
      #swagger.summary = 'Reembolsa um pagamento'
      #swagger.description = 'Reembolsa um pagamento que está em status approved'
      #swagger.parameters['id'] = {
        in: 'path',
        description: 'ID único do pagamento a ser reembolsado',
        required: true,
        type: 'string',
        example: '507f1f77bcf86cd799439011'
      }
      #swagger.responses[200] = {
        description: 'Pagamento reembolsado com sucesso',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                paymentId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                orderId: { type: 'string', example: 'order456' },
                status: { type: 'string', example: 'refunded' }
              }
            },
            message: { type: 'string', example: 'Pagamento reembolsado com sucesso' },
            _links: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rel: { type: 'string', example: 'self' },
                  href: { type: 'string', example: '/api/payments/507f1f77bcf86cd799439011' },
                  method: { type: 'string', example: 'GET' }
                }
              }
            }
          }
        }
      }
      #swagger.responses[400] = {
        description: 'Pagamento não pode ser reembolsado (status inválido)',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
      #swagger.responses[404] = {
        description: 'Pagamento não encontrado',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
      #swagger.responses[500] = {
        description: 'Erro interno do servidor',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
  */
);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Recebe notificações de pagamento do Mercado Pago
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Objeto de notificação do Mercado Pago
 *     responses:
 *       202:
 *         description: Notificação recebida com sucesso
 */
router.post(
  "/webhook",
  paymentController.webhook
  /*  #swagger.tags = ['Webhooks']
      #swagger.summary = 'Recebe notificações de pagamento do Mercado Pago'
      #swagger.description = 'Endpoint para receber notificações automáticas sobre mudanças de status dos pagamentos'
      #swagger.parameters['body'] = {
        in: 'body',
        description: 'Dados da notificação do Mercado Pago',
        required: true,
        schema: {
          $ref: '#/definitions/WebhookRequest'
        }
      }
      #swagger.responses[202] = {
        description: 'Notificação recebida e será processada',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object', example: null },
            message: { type: 'string', example: 'Notificação recebida e será processada' },
            _links: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rel: { type: 'string', example: 'payments' },
                  href: { type: 'string', example: '/api/payments' },
                  method: { type: 'string', example: 'GET' }
                }
              }
            }
          }
        }
      }
      #swagger.responses[500] = {
        description: 'Erro interno do servidor',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
  */
);

/**
 * @swagger
 * /api/payments/order/{orderId}:
 *   get:
 *     summary: Obtém informações de um pagamento por Order ID
 *     tags: [Pagamentos]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID do pagamento
 *     responses:
 *       200:
 *         description: Informações do pagamento
 *       404:
 *         description: Pagamento não encontrado para este orderId
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/order/:orderId",
  methodValidation.methodValidator(["GET", "HEAD", "OPTIONS"]),
  cacheMiddleware.setCacheHeaders(60),
  cacheMiddleware.setEtagHeader(),
  cacheMiddleware.setLastModifiedHeader(async (req) => {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    return payment ? payment.updatedAt || payment.createdAt : null;
  }),
  paymentController.getPaymentByOrderId
  /*  #swagger.tags = ['Pagamentos']
      #swagger.summary = 'Obtém informações de um pagamento por Order ID'
      #swagger.description = 'Busca um pagamento específico usando o ID do pedido'
      #swagger.parameters['orderId'] = {
        in: 'path',
        description: 'ID único do pedido (Order ID)',
        required: true,
        type: 'string',
        example: 'order456'
      }
      #swagger.responses[200] = {
        description: 'Informações do pagamento encontrado',
        schema: {
          $ref: '#/definitions/PaymentResponse'
        }
      }
      #swagger.responses[404] = {
        description: 'Pagamento não encontrado para este orderId',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
      #swagger.responses[500] = {
        description: 'Erro interno do servidor',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
  */
);

/**
 * @swagger
 * /api/payments/user/{userId}:
 *   get:
 *     summary: Obtém todos os pagamentos de um usuário com filtros opcionais
 *     tags: [Pagamentos]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled, refunded]
 *         description: Filtrar por status do pagamento
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial para filtro (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final para filtro (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de pagamentos do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Parâmetros inválidos
 *       404:
 *         description: Usuário não encontrado ou sem pagamentos
 *       500:
 *         description: Erro interno do servidor
 */
router.get(
  "/user/:userId",
  methodValidation.methodValidator(["GET", "HEAD", "OPTIONS"]),
  cacheMiddleware.setCacheHeaders(30),
  cacheMiddleware.setEtagHeader(),
  paymentController.getPaymentsByUserId
  /*  #swagger.tags = ['Pagamentos']
      #swagger.summary = 'Obtém todos os pagamentos de um usuário com filtros opcionais'
      #swagger.description = 'Busca todos os pagamentos de um usuário específico com suporte a filtros por status, datas e paginação'
      #swagger.parameters['userId'] = {
        in: 'path',
        description: 'ID único do usuário',
        required: true,
        type: 'string',
        example: 'user123'
      }
      #swagger.parameters['status'] = {
        in: 'query',
        description: 'Filtrar por status do pagamento',
        required: false,
        type: 'string',
        enum: ['pending', 'approved', 'rejected', 'cancelled', 'refunded'],
        example: 'approved'
      }
      #swagger.parameters['page'] = {
        in: 'query',
        description: 'Número da página para paginação',
        required: false,
        type: 'integer',
        example: 1
      }
      #swagger.parameters['limit'] = {
        in: 'query',
        description: 'Quantidade de itens por página',
        required: false,
        type: 'integer',
        example: 10
      }
      #swagger.parameters['startDate'] = {
        in: 'query',
        description: 'Data inicial para filtro (formato: YYYY-MM-DD)',
        required: false,
        type: 'string',
        example: '2024-01-01'
      }
      #swagger.parameters['endDate'] = {
        in: 'query',
        description: 'Data final para filtro (formato: YYYY-MM-DD)',
        required: false,
        type: 'string',
        example: '2024-01-31'
      }
      #swagger.responses[200] = {
        description: 'Lista de pagamentos do usuário com filtros aplicados',
        schema: {
          $ref: '#/definitions/UserPaymentsResponse'
        }
      }
      #swagger.responses[400] = {
        description: 'Parâmetros inválidos (userId obrigatório, status ou datas inválidas)',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
      #swagger.responses[404] = {
        description: 'Nenhum pagamento encontrado para este usuário',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
      #swagger.responses[500] = {
        description: 'Erro interno do servidor',
        schema: {
          $ref: '#/definitions/ErrorResponse'
        }
      }
  */
);

module.exports = router;
