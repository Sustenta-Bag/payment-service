const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Simulação de Pagamentos',
      version: '1.0.0',
      description: 'API RESTful para processamento de simulação de pagamentos com suporte a HATEOAS e JSON:API',
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
        Link: {
          type: 'object',
          properties: {
            rel: {
              type: 'string',
              description: 'Relação do link'
            },
            href: {
              type: 'string',
              description: 'URL do link'
            },
            method: {
              type: 'string',
              description: 'Método HTTP do link'
            }
          }
        },
        HateoasResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica se a operação foi bem-sucedida'
            },
            data: {
              type: 'object',
              description: 'Dados da resposta'
            },
            _links: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Link'
              },
              description: 'Links HATEOAS relacionados ao recurso'
            },
            message: {
              type: 'string',
              description: 'Mensagem descritiva (opcional)'
            }
          }
        },
        JsonApi: {
          type: 'object',
          properties: {
            jsonapi: {
              type: 'object',
              properties: {
                version: {
                  type: 'string',
                  description: 'Versão da especificação JSON:API'
                }
              }
            },
            data: {
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      description: 'Tipo do recurso'
                    },
                    id: {
                      type: 'string',
                      description: 'ID do recurso'
                    },
                    attributes: {
                      type: 'object',
                      description: 'Atributos do recurso'
                    },
                    links: {
                      type: 'object',
                      description: 'Links relacionados ao recurso'
                    }
                  }
                },
                {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        description: 'Tipo do recurso'
                      },
                      id: {
                        type: 'string',
                        description: 'ID do recurso'
                      },
                      attributes: {
                        type: 'object',
                        description: 'Atributos do recurso'
                      },
                      links: {
                        type: 'object',
                        description: 'Links relacionados ao recurso'
                      }
                    }
                  }
                }
              ]
            },
            meta: {
              type: 'object',
              description: 'Metadados da resposta'
            },
            links: {
              type: 'object',
              description: 'Links relacionados à coleção'
            }
          }
        },
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
              enum: ['pending', 'approved', 'rejected', 'cancelled', 'refunded'],
              description: 'Status do pagamento',
            },
            paymentUrl: {
              type: 'string',
              description: 'URL para simulação de pagamento',
            },
            paymentId: {
              type: 'string',
              description: 'ID do pagamento simulado',
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
