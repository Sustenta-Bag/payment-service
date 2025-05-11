const express = require('express');
const paymentController = require('../controllers/paymentController');
const router = express.Router();

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
router.post('/', paymentController.createPayment);
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
router.get('/:id', paymentController.getPayment);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Recebe notificações de pagamento do Mercado Pago
 *     tags: [Pagamentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Objeto de notificação do Mercado Pago
 *     responses:
 *       200:
 *         description: Notificação recebida com sucesso
 */
router.post('/webhook', paymentController.webhook);

module.exports = router;