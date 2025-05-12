const app = require('./app');
const config = require('./config/config');
const rabbitMQService = require('./services/rabbitMQ');
const logger = require('./utils/logger');

async function startServer() {
  try {
    try {
      await rabbitMQService.connect();
      logger.info('Conectado ao RabbitMQ');
    } catch (error) {
      logger.warn(`Aviso: Não foi possível conectar ao RabbitMQ: ${error.message}`);
      logger.warn('O serviço iniciará sem conexão com o RabbitMQ. Alguns recursos podem não funcionar.');
    }
    
    const server = app.listen(config.port, () => {
      logger.info(`Servidor rodando na porta ${config.port}`);
    });

    const shutdown = async () => {
      logger.info('Desligando servidor...');
      
      server.close(async () => {
        logger.info('Servidor HTTP encerrado');
        
        try {
          await rabbitMQService.close();
          logger.info('Conexões fechadas');
          process.exit(0);
        } catch (error) {
          logger.error(`Erro ao fechar conexões: ${error.message}`);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error(`Erro ao iniciar servidor: ${error.message}`);
    process.exit(1);
  }
}

startServer();