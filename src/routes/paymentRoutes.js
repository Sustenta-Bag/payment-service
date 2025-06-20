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
 *                 example: "user123"
 *               orderId:
 *                 type: string
 *                 description: ID do pedido (opcional, será gerado se não fornecido)
 *                 example: "order456"
 *               items:
 *                 type: array
 *                 description: Lista de itens do pagamento
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                     - description
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     title:
 *                       type: string
 *                       description: Título do item
 *                       example: "Produto A"
 *                     description:
 *                       type: string
 *                       description: Descrição do item
 *                       example: "Descrição detalhada do produto"
 *                     quantity:
 *                       type: integer
 *                       description: Quantidade do item
 *                       example: 2
 *                     unitPrice:
 *                       type: number
 *                       description: Preço unitário do item
 *                       example: 29.99
 *               payer:
 *                 type: object
 *                 description: Informações do pagador
 *                 required:
 *                   - email
 *                   - name
 *                 properties:
 *                   email:
 *                     type: string
 *                     description: Email do pagador
 *                     example: "pagador@email.com"
 *                   name:
 *                     type: string
 *                     description: Nome do pagador
 *                     example: "João Silva"
 *                   identification:
 *                     type: object
 *                     description: Dados de identificação (opcional)
 *                     properties:
 *                       type:
 *                         type: string
 *                         description: Tipo de documento
 *                         example: "CPF"
 *                       number:
 *                         type: string
 *                         description: Número do documento
 *                         example: "12345678901"
 *               callbackUrl:
 *                 type: string
 *                 description: URL de retorno após o pagamento (opcional)
 *                 example: "https://meusite.com/callback"
 *     responses:
 *       201:
 *         description: Pagamento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     orderId:
 *                       type: string
 *                       example: "order456"
 *                     amount:
 *                       type: number
 *                       example: 59.98
 *                     paymentUrl:
 *                       type: string
 *                       example: "https://payment.url/init_point"
 *                 _links:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rel:
 *                         type: string
 *                         example: "self"
 *                       href:
 *                         type: string
 *                         example: "/api/payments/507f1f77bcf86cd799439011"
 *                       method:
 *                         type: string
 *                         example: "GET"
 *       400:
 *         description: Dados inválidos ou incompletos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Dados incompletos para criação do pagamento. userId, orderId, items e payer são obrigatórios"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Erro ao processar pagamento"
 *                 error:
 *                   type: string
 *                   example: "Detalhes do erro"
 */
router.post(
  "/",
  methodValidation.methodValidator(["POST"]),
  paymentController.createPayment
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     orderId:
 *                       type: string
 *                       example: "order456"
 *                     userId:
 *                       type: string
 *                       example: "user123"
 *                     amount:
 *                       type: number
 *                       example: 59.98
 *                     currency:
 *                       type: string
 *                       example: "BRL"
 *                     status:
 *                       type: string
 *                       enum: [pending, approved, rejected, cancelled, refunded]
 *                       example: "pending"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: "Produto A"
 *                           description:
 *                             type: string
 *                             example: "Descrição do produto"
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           unitPrice:
 *                             type: number
 *                             example: 29.99
 *                     paymentMethod:
 *                       type: string
 *                       example: "simulation"
 *                     paymentId:
 *                       type: string
 *                       example: "sim_payment_123"
 *                     paymentUrl:
 *                       type: string
 *                       example: "https://payment.url/init_point"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:35:00.000Z"
 *                 _links:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rel:
 *                         type: string
 *                         example: "self"
 *                       href:
 *                         type: string
 *                         example: "/api/payments/507f1f77bcf86cd799439011"
 *                       method:
 *                         type: string
 *                         example: "GET"
 *       404:
 *         description: Pagamento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Pagamento não encontrado"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Erro ao obter pagamento"
 *                 error:
 *                   type: string
 *                   example: "Detalhes do erro"
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     payments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           orderId:
 *                             type: string
 *                             example: "order456"
 *                           userId:
 *                             type: string
 *                             example: "user123"
 *                           amount:
 *                             type: number
 *                             example: 59.98
 *                           currency:
 *                             type: string
 *                             example: "BRL"
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected, cancelled, refunded]
 *                             example: "pending"
 *                           paymentMethod:
 *                             type: string
 *                             example: "simulation"
 *                           paymentUrl:
 *                             type: string
 *                             example: "https://payment.url/init_point"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:35:00.000Z"
 *                           _links:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 rel:
 *                                   type: string
 *                                   example: "self"
 *                                 href:
 *                                   type: string
 *                                   example: "/api/payments/507f1f77bcf86cd799439011"
 *                                 method:
 *                                   type: string
 *                                   example: "GET"
 *                     _meta:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 100
 *                         totalPages:
 *                           type: integer
 *                           example: 10
 *                 _links:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rel:
 *                         type: string
 *                         example: "next"
 *                       href:
 *                         type: string
 *                         example: "/api/payments?page=2&limit=10"
 *                       method:
 *                         type: string
 *                         example: "GET"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Erro ao listar pagamentos"
 *                 error:
 *                   type: string
 *                   example: "Detalhes do erro"
 */
router.get(
  "/",
  methodValidation.methodValidator(["GET", "HEAD", "OPTIONS"]),
  cacheMiddleware.setCacheHeaders(30),
  cacheMiddleware.setEtagHeader(),
  paymentController.listPayments
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     orderId:
 *                       type: string
 *                       example: "order456"
 *                     status:
 *                       type: string
 *                       example: "cancelled"
 *                 message:
 *                   type: string
 *                   example: "Pagamento cancelado com sucesso"
 *                 _links:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rel:
 *                         type: string
 *                         example: "self"
 *                       href:
 *                         type: string
 *                         example: "/api/payments/507f1f77bcf86cd799439011"
 *                       method:
 *                         type: string
 *                         example: "GET"
 *       404:
 *         description: Pagamento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Pagamento não encontrado"
 *       400:
 *         description: Pagamento não pode ser cancelado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Não é possível cancelar um pagamento com status 'approved'"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Erro ao cancelar pagamento"
 *                 error:
 *                   type: string
 *                   example: "Detalhes do erro"
 */
router.post(
  "/:id/cancel",
  methodValidation.methodValidator(["POST"]),
  paymentController.cancelPayment
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     orderId:
 *                       type: string
 *                       example: "order456"
 *                     status:
 *                       type: string
 *                       example: "refunded"
 *                 message:
 *                   type: string
 *                   example: "Pagamento reembolsado com sucesso"
 *                 _links:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rel:
 *                         type: string
 *                         example: "self"
 *                       href:
 *                         type: string
 *                         example: "/api/payments/507f1f77bcf86cd799439011"
 *                       method:
 *                         type: string
 *                         example: "GET"
 *       404:
 *         description: Pagamento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Pagamento não encontrado"
 *       400:
 *         description: Pagamento não pode ser reembolsado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Não é possível reembolsar um pagamento com status 'pending'"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Erro ao reembolsar pagamento"
 *                 error:
 *                   type: string
 *                   example: "Detalhes do erro"
 */
router.post(
  "/:id/refund",
  methodValidation.methodValidator(["POST"]),
  paymentController.refundPayment
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
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID da notificação
 *                 example: "12345"
 *               live_mode:
 *                 type: boolean
 *                 description: Se está em modo produção
 *                 example: false
 *               type:
 *                 type: string
 *                 description: Tipo da notificação
 *                 example: "payment"
 *               date_created:
 *                 type: string
 *                 format: date-time
 *                 description: Data de criação da notificação
 *                 example: "2024-01-15T10:30:00.000Z"
 *               action:
 *                 type: string
 *                 description: Ação executada
 *                 example: "payment.updated"
 *               data:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID do pagamento
 *                     example: "mp_payment_123"
 *     responses:
 *       202:
 *         description: Notificação recebida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   example: null
 *                 message:
 *                   type: string
 *                   example: "Notificação recebida e será processada"
 *                 _links:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rel:
 *                         type: string
 *                         example: "payments"
 *                       href:
 *                         type: string
 *                         example: "/api/payments"
 *                       method:
 *                         type: string
 *                         example: "GET"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Erro ao processar webhook"
 *                 error:
 *                   type: string
 *                   example: "Detalhes do erro"
 */
router.post("/webhook", paymentController.webhook);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     orderId:
 *                       type: string
 *                       example: "order456"
 *                     userId:
 *                       type: string
 *                       example: "user123"
 *                     amount:
 *                       type: number
 *                       example: 59.98
 *                     currency:
 *                       type: string
 *                       example: "BRL"
 *                     status:
 *                       type: string
 *                       enum: [pending, approved, rejected, cancelled, refunded]
 *                       example: "pending"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: "Produto A"
 *                           description:
 *                             type: string
 *                             example: "Descrição do produto"
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           unitPrice:
 *                             type: number
 *                             example: 29.99
 *                     paymentMethod:
 *                       type: string
 *                       example: "simulation"
 *                     paymentId:
 *                       type: string
 *                       example: "sim_payment_123"
 *                     paymentUrl:
 *                       type: string
 *                       example: "https://payment.url/init_point"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:35:00.000Z"
 *                 _links:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rel:
 *                         type: string
 *                         example: "self"
 *                       href:
 *                         type: string
 *                         example: "/api/payments/507f1f77bcf86cd799439011"
 *                       method:
 *                         type: string
 *                         example: "GET"
 *       404:
 *         description: Pagamento não encontrado para este orderId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Pagamento não encontrado para este orderId"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Erro ao obter pagamento por orderId"
 *                 error:
 *                   type: string
 *                   example: "Detalhes do erro"
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
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                         example: true
 *                       data:
 *                         type: object
 *                         properties:
 *                           paymentId:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           orderId:
 *                             type: string
 *                             example: "order456"
 *                           userId:
 *                             type: string
 *                             example: "user123"
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected, cancelled, refunded]
 *                             example: "pending"
 *                           amount:
 *                             type: number
 *                             example: 59.98
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 title:
 *                                   type: string
 *                                   example: "Produto A"
 *                                 description:
 *                                   type: string
 *                                   example: "Descrição do produto"
 *                                 quantity:
 *                                   type: integer
 *                                   example: 2
 *                                 unitPrice:
 *                                   type: number
 *                                   example: 29.99
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:35:00.000Z"
 *                           paymentUrl:
 *                             type: string
 *                             example: "https://payment.url/init_point"
 *                       message:
 *                         type: string
 *                         example: "Dados do pagamento"
 *                       _links:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             rel:
 *                               type: string
 *                               example: "self"
 *                             href:
 *                               type: string
 *                               example: "/api/payments/507f1f77bcf86cd799439011"
 *                             method:
 *                               type: string
 *                               example: "GET"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *                 stats:
 *                   type: object
 *                   properties:
 *                     pending:
 *                       type: integer
 *                       example: 10
 *                     approved:
 *                       type: integer
 *                       example: 25
 *                     rejected:
 *                       type: integer
 *                       example: 5
 *                     cancelled:
 *                       type: integer
 *                       example: 8
 *                     refunded:
 *                       type: integer
 *                       example: 2
 *                 _links:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rel:
 *                         type: string
 *                         example: "next"
 *                       href:
 *                         type: string
 *                         example: "/api/payments/user/user123?page=2&limit=10"
 *                       method:
 *                         type: string
 *                         example: "GET"
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "userId é obrigatório"
 *       404:
 *         description: Usuário não encontrado ou sem pagamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Nenhum pagamento encontrado para este usuário"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Erro ao buscar pagamentos do usuário"
 *                 error:
 *                   type: string
 *                   example: "Detalhes do erro"
 */
router.get(
  "/user/:userId",
  methodValidation.methodValidator(["GET", "HEAD", "OPTIONS"]),
  cacheMiddleware.setCacheHeaders(30),
  cacheMiddleware.setEtagHeader(),
  paymentController.getPaymentsByUserId
);

module.exports = router;
