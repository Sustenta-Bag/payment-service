const app = require("./app");
const config = require("./config/config");
const rabbitMQService = require("./services/rabbitMQ");
const queueConsumers = require("./services/queueConsumers");
const logger = require("./utils/logger");

async function startServer() {
  try {
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Servidor rodando na porta ${config.port}`);
    });

    const shutdown = async () => {
      logger.info("🛑 Desligando servidor...");

      server.close(async () => {
        logger.info("📡 Servidor HTTP encerrado");

        try {
          await queueConsumers.stopConsumers();
          await rabbitMQService.close();
          logger.info("🔌 Conexões fechadas");
          process.exit(0);
        } catch (error) {
          logger.error(`❌ Erro ao fechar conexões: ${error.message}`);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    queueConsumers
      .startConsumers()
      .then(() => {
        logger.info("🐰 Consumidores RabbitMQ iniciados com sucesso");
      })
      .catch((error) => {
        logger.error(
          `🚨 Falha crítica ao iniciar consumidores RabbitMQ: ${error.message}`
        );
        logger.warn(
          "⚠️ O serviço continuará rodando sem conexão com RabbitMQ. Alguns recursos podem não funcionar."
        );
      });
  } catch (error) {
    logger.error(`💥 Erro ao iniciar servidor: ${error.message}`);
    process.exit(1);
  }
}

startServer();
