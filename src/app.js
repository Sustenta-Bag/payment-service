const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const config = require('./config/config');
const paymentRoutes = require('./routes/paymentRoutes');
const testRoutes = require('./routes/testRoutes');
const setupSwagger = require('./config/swagger');
const logger = require('./utils/logger');

// Inicializa Express
const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Rotas
app.use('/api/payments', paymentRoutes);

// Configuração do Swagger
setupSwagger(app);
logger.info('Documentação Swagger disponível em /api-docs');

// Rotas de teste (apenas em desenvolvimento)
if (config.env === 'development') {
  app.use('/api/test', testRoutes);
  logger.info('Rotas de teste habilitadas');
}

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Rota da página inicial
app.get('/', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Serviço de Pagamento</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
        line-height: 1.6;
        color: #333;
      }
      header {
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      h1 {
        color: #2c3e50;
      }
      h2 {
        color: #3498db;
        margin-top: 30px;
      }
      .container {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
      }
      .card {
        flex: 1 1 400px;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      .card h3 {
        margin-top: 0;
        color: #2980b9;
      }
      a {
        color: #3498db;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      code {
        background-color: #f5f5f5;
        padding: 2px 5px;
        border-radius: 3px;
        font-family: Consolas, Monaco, 'Andale Mono', monospace;
      }
      pre {
        background-color: #f5f5f5;
        padding: 15px;
        border-radius: 5px;
        overflow-x: auto;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Serviço de Pagamento</h1>
      <p>API para processamento de pagamentos com integração ao Mercado Pago</p>
    </header>

    <main>
      <section>
        <h2>Documentação da API</h2>
        <p>Para acessar a documentação completa da API, consulte o <a href="/api-docs">Swagger</a>.</p>
      </section>

      <section>
        <h2>Recursos Disponíveis</h2>
        <div class="container">
          <div class="card">
            <h3>Pagamentos</h3>
            <p>Crie e gerencie pagamentos via Mercado Pago.</p>
            <p><strong>Endpoints:</strong></p>
            <ul>
              <li><code>POST /api/payments</code> - Criar novo pagamento</li>
              <li><code>GET /api/payments/:id</code> - Obter detalhes de um pagamento</li>
              <li><code>POST /api/payments/webhook</code> - Webhook para notificações</li>
            </ul>
          </div>

          <div class="card">
            <h3>Ferramentas de Teste</h3>
            <p>Endpoints disponíveis apenas no ambiente de desenvolvimento.</p>
            <p><strong>Endpoints:</strong></p>
            <ul>
              <li><code>POST /api/test/simulate-payment</code> - Simular pagamento</li>
              <li><code>GET /api/test/payments</code> - Listar pagamentos</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>Exemplo de Uso</h2>
        <pre>
fetch('/api/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user123',
    items: [
      {
        title: 'Produto Teste',
        description: 'Descrição do produto',
        quantity: 1,
        unitPrice: 100.00
      }
    ],
    payer: {
      email: 'cliente@exemplo.com',
      name: 'Cliente Teste',
      identification: {
        type: 'CPF',
        number: '12345678909'
      }
    }
  })
})
.then(response => response.json())
.then(data => console.log(data));
        </pre>
      </section>
    </main>

    <footer style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
      <p>Versão 1.0.0 &copy; ${new Date().getFullYear()}</p>
    </footer>
  </body>
  </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  logger.error(`Erro não tratado: ${err.message}`);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    stack: config.env === 'development' ? err.stack : undefined
  });
});

// Conexão com MongoDB
mongoose.connect(config.mongodb.uri)
  .then(() => {
    logger.info('Conectado ao MongoDB');
  })
  .catch((err) => {
    logger.error(`Erro ao conectar ao MongoDB: ${err.message}`);
    process.exit(1);
  });

module.exports = app;