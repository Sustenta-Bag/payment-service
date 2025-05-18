/**
 * Script para testar o sistema de notificações com exchange direct
 */

const amqp = require('amqplib');
const config = require('./src/config/config');

async function testNotification() {
  console.log('Iniciando teste de notificação com exchange direct...');
  console.log(`Exchange: ${config.rabbitmq.exchanges.notifications}`);
  console.log(`Routing Key: notification`);
  
  try {
    // Conectar ao RabbitMQ
    const connection = await amqp.connect(config.rabbitmq.url);
    const channel = await connection.createChannel();
    
    // Verificar se o exchange existe
    await channel.checkExchange(config.rabbitmq.exchanges.notifications);
    console.log(`✅ Exchange '${config.rabbitmq.exchanges.notifications}' existe!`);
    
    // Enviar uma mensagem de teste
    const message = {
      token: "test_token",
      notification: {
        title: "Teste de Notificação",
        body: "Esta é uma notificação de teste"
      },
      data: {
        testId: "test123",
        timestamp: new Date().toISOString()
      }
    };
    
    const result = await channel.publish(
      config.rabbitmq.exchanges.notifications,
      'notification',
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    
    console.log(`✅ Mensagem publicada com sucesso: ${result}`);
    console.log(`Mensagem enviada: ${JSON.stringify(message, null, 2)}`);
    
    // Fechar conexão
    await channel.close();
    await connection.close();
    
    console.log('✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Executar o teste
testNotification().catch(console.error);
