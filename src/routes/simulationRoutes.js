const express = require("express");
const simulationController = require("../controllers/simulationController");
const router = express.Router();

/**
 * @swagger
 * /api/payment-simulation/{id}:
 *   get:
 *     summary: Renderiza a página de simulação de pagamento
 *     tags: [Simulação]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da simulação de pagamento
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *       - in: query
 *         name: amount
 *         required: false
 *         schema:
 *           type: number
 *         description: Valor do pagamento
 *     responses:
 *       200:
 *         description: Página de simulação de pagamento
 *       404:
 *         description: Pagamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/:id", simulationController.renderPaymentSimulation);

/**
 * @swagger
 * /api/payment-simulation/process:
 *   post:
 *     summary: Processa uma simulação de pagamento
 *     tags: [Simulação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - action
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: ID do pedido
 *               action:
 *                 type: string
 *                 description: Ação a ser realizada (approve, pending, reject)
 *     responses:
 *       200:
 *         description: Simulação processada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Pagamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/process", simulationController.processPaymentSimulation);

/**
 * @swagger
 * /api/payment-simulation/status/{orderId}:
 *   get:
 *     summary: Obtém o status de um pagamento simulado
 *     tags: [Simulação]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Status do pagamento simulado
 *       404:
 *         description: Pagamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/status/:orderId", simulationController.getSimulatedPaymentStatus);

module.exports = router;
