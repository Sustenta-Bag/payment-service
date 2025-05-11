const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

/**
 * @swagger
 * /api/test/simulate-payment:
 *   post:
 *     summary: Simula um pagamento (apenas ambiente de desenvolvimento)
 *     tags: [Testes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: ID do pedido a ser atualizado
 *               status:
 *                 type: string
 *                 description: Status do pagamento
 *                 enum: ['pending', 'approved', 'rejected', 'refunded']
 *                 default: 'approved'
 *     responses:
 *       200:
 *         description: Status do pagamento atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Pagamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/simulate-payment', testController.simulatePayment);

/**
 * @swagger
 * /api/test/payments:
 *   get:
 *     summary: Lista os últimos pagamentos para teste
 *     tags: [Testes]
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: ID do pagamento
 *                       orderId:
 *                         type: string
 *                         description: ID do pedido
 *                       status:
 *                         type: string
 *                         description: Status do pagamento
 *                       amount:
 *                         type: number
 *                         description: Valor total
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Data de criação
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/payments', testController.listPayments);

module.exports = router;
