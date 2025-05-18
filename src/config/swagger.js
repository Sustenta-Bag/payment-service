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
            },
            title: {
              type: 'string',
              description: 'Título descritivo do link'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            totalItems: {
              type: 'integer',
              description: 'Número total de itens na coleção'
            },
            itemsPerPage: {
              type: 'integer',
              description: 'Número de itens por página'
            },
            currentPage: {
              type: 'integer',
              description: 'Página atual'
            },
            totalPages: {
              type: 'integer',
              description: 'Número total de páginas'
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
        },      },
    },
    components: {
      parameters: {
        pageParam: {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1
          },
          description: 'Página atual para resultados paginados'
        },
        limitParam: {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            default: 10
          },
          description: 'Número de itens por página'
        },
        versionParam: {
          in: 'query',
          name: 'version',
          schema: {
            type: 'string'
          },
          description: 'Versão da API a ser utilizada'
        }
      },
      headers: {
        AcceptVersion: {
          description: 'Versão da API a ser utilizada',
          schema: {
            type: 'string',
            example: 'application/json; version=1.0.0'
          }
        },
        IfNoneMatch: {
          description: 'ETag para validação de cache',
          schema: {
            type: 'string',
            example: '"33a64df551425fcc55e4d42a148795d9f25f89d4"'
          }
        },
        IfModifiedSince: {
          description: 'Data de última modificação para validação de cache',
          schema: {
            type: 'string',
            example: 'Wed, 18 May 2025 12:28:53 GMT'
          }
        }
      },
      responses: {
        NotModified: {
          description: 'Conteúdo não modificado desde a última requisição'
        },
        MethodNotAllowed: {
          description: 'Método HTTP não permitido para este recurso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Method not allowed for this resource'
              }
            }
          }
        },
        UnsupportedMediaType: {
          description: 'Formato de mídia não suportado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Unsupported media type'
              }
            }
          }
        }
      }
    },
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      displayRequestDuration: true
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API RESTful de Pagamentos - Documentação'
  }));
};
