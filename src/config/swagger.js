const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Pagamentos',
      version: '1.0.0',
      description: 'API para processamento de pagamentos com integração ao Mercado Pago',
      contact: {
        name: 'Suporte',
        email: 'suporte@exemplo.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desenvolvimento',
      },
    ],
    components: {
      schemas: {
        Payment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único do pagamento',
            },
            orderId: {
              type: 'string',
              description: 'ID único do pedido',
            },
            userId: {
              type: 'string',
              description: 'ID do usuário',
            },
            amount: {
              type: 'number',
              description: 'Valor total do pagamento',
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected', 'refunded'],
              description: 'Status do pagamento',
            },
            paymentUrl: {
              type: 'string',
              description: 'URL para pagamento no Mercado Pago',
            },
            mercadopagoId: {
              type: 'string',
              description: 'ID do pagamento no Mercado Pago',
            },
            paymentMethod: {
              type: 'string',
              description: 'Método de pagamento utilizado',
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: 'Título do item',
                  },
                  description: {
                    type: 'string',
                    description: 'Descrição do item',
                  },
                  quantity: {
                    type: 'integer',
                    description: 'Quantidade do item',
                  },
                  unitPrice: {
                    type: 'number',
                    description: 'Preço unitário do item',
                  },
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação do pagamento',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data da última atualização do pagamento',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Mensagem de erro',
            },
            error: {
              type: 'string',
              example: 'Detalhes do erro',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
