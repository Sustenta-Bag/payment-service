/**
 * Script para testar o sistema de notificações
 * 
 * Este script cria um pagamento e depois o aprova ou rejeita,
 * verificando se as notificações são enviadas corretamente.
 */

const axios = require('axios');
const readline = require('readline');

const API_URL = 'http://localhost:3001/api';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Cria um novo pagamento
 */
async function createPayment() {
  try {
    const response = await axios.post(`${API_URL}/payments`, {
      userId: "user-123",
      items: [
        {
          title: "Produto Teste",
          description: "Um produto para testar o sistema de notificações",
          quantity: 1,
          unitPrice: 99.90
        }
      ],
      payer: {
        name: "Usuário Teste",
        email: "usuario@teste.com"
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao criar pagamento:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Processa o pagamento (aprova ou rejeita)
 */
async function processPayment(orderId, action) {
  try {
    const response = await axios.post(`${API_URL}/payment-simulation/process`, {
      orderId,
      action // 'approve' ou 'reject'
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao processar pagamento:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('Criando um novo pagamento...');
    const paymentData = await createPayment();
    console.log(`Pagamento criado com sucesso! OrderID: ${paymentData.data.orderId}`);
    
    rl.question('Escolha a ação (approve/reject): ', async (action) => {
      if (action !== 'approve' && action !== 'reject') {
        console.log('Ação inválida. Use "approve" ou "reject".');
        rl.close();
        return;
      }
      
      console.log(`Processando pagamento com ação: ${action}`);
      const result = await processPayment(paymentData.data.orderId, action);
      
      console.log(`Pagamento processado com sucesso!`);
      console.log(`Status do pagamento: ${result.data.status}`);
      console.log(`Uma notificação deve ter sido enviada para o RabbitMQ.`);
      
      rl.close();
    });
  } catch (error) {
    console.error('Erro durante o teste:', error);
    rl.close();
  }
}

// Executar o teste
main().catch(console.error);
