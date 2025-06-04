const express = require("express");
const paymentController = require("../controllers/paymentController");
const cacheMiddleware = require("../middlewares/cacheMiddleware");
const methodValidation = require("../middlewares/methodValidationMiddleware");
const Payment = require("../models/payment");
const router = express.Router();

// Middleware para validação de preflight CORS
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
  // #swagger.tags = ['Pagamentos']
  // #swagger.summary = 'Cria um novo pagamento'
  // #swagger.description = 'Cria um novo pagamento no sistema'
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
  // #swagger.tags = ['Pagamentos']
  // #swagger.summary = 'Obtém informações de um pagamento por ID'
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
  // #swagger.tags = ['Pagamentos']
  // #swagger.summary = 'Lista todos os pagamentos com paginação'
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
  // #swagger.tags = ['Pagamentos']
  // #swagger.summary = 'Cancela um pagamento'
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
  // #swagger.tags = ['Pagamentos']
  // #swagger.summary = 'Reembolsa um pagamento'
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
  // #swagger.tags = ['Webhooks']
  // #swagger.summary = 'Recebe notificações de pagamento do Mercado Pago'
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
  // #swagger.tags = ['Pagamentos']
  // #swagger.summary = 'Obtém informações de um pagamento por Order ID'
);

module.exports = router;
