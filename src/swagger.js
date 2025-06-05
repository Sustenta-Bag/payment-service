const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "API de Pagamentos",
    version: "1.0.0",
    description:
      "API RESTful para processamento de pagamentos com suporte a HATEOAS e JSON:API. Esta API permite criar, gerenciar e processar pagamentos com filtros avançados e paginação.",
    contact: {
      name: "Suporte",
      email: "suporte@exemplo.com",
    },
  },
  host: "localhost:3001",
  schemes: ["http"],
  basePath: "/",
  tags: [
    {
      name: "API",
      description: "Endpoints de controle da API",
    },
    {
      name: "Pagamentos",
      description: "Endpoints para gerenciamento de pagamentos",
    },
    {
      name: "Simulações",
      description: "Endpoints para simulação de pagamentos"
    },
    {
      name: "Webhooks",
      description: "Endpoints para receber notificações de pagamentos",
    },
    {
      name: "Health",
      description: "Endpoints para verificação de saúde do sistema",
    },
  ],
  definitions: {
    CreatePaymentRequest: {
      type: "object",
      required: ["userId", "orderId", "items", "payer"],
      properties: {
        userId: {
          type: "string",
          description: "ID único do usuário",
          example: "user123"
        },
        orderId: {
          type: "string", 
          description: "ID único do pedido",
          example: "order456"
        },
        items: {
          type: "array",
          description: "Lista de itens do pagamento",
          items: {
            type: "object",
            required: ["title", "quantity", "unitPrice"],
            properties: {
              title: {
                type: "string",
                description: "Nome do produto",
                example: "Smartphone Samsung Galaxy"
              },
              description: {
                type: "string",
                description: "Descrição detalhada do produto",
                example: "Smartphone Samsung Galaxy A54 128GB Preto"
              },
              quantity: {
                type: "integer",
                minimum: 1,
                description: "Quantidade do item",
                example: 2
              },
              unitPrice: {
                type: "number",
                minimum: 0.01,
                description: "Preço unitário em reais",
                example: 899.99
              }
            }
          },
          example: [
            {
              title: "Smartphone Samsung Galaxy",
              description: "Smartphone Samsung Galaxy A54 128GB Preto",
              quantity: 2,
              unitPrice: 899.99
            },
            {
              title: "Fone de Ouvido Bluetooth",
              description: "Fone de Ouvido Bluetooth JBL Tune 760NC",
              quantity: 1,
              unitPrice: 299.99
            }
          ]
        },
        payer: {
          type: "object",
          required: ["email", "name", "identification"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Email do pagador",
              example: "joao.silva@email.com"
            },
            name: {
              type: "string",
              description: "Nome completo do pagador",
              example: "João Silva Santos"
            },
            identification: {
              type: "object",
              required: ["type", "number"],
              properties: {
                type: {
                  type: "string",
                  enum: ["CPF", "CNPJ"],
                  description: "Tipo de documento",
                  example: "CPF"
                },
                number: {
                  type: "string",
                  description: "Número do documento",
                  example: "12345678901"
                }
              }
            }
          }
        },
        callbackUrl: {
          type: "string",
          format: "uri",
          description: "URL para callback após processamento do pagamento",
          example: "https://meusite.com/webhook/payment"
        },
        authToken: {
          type: "string",
          description: "Token de autenticação (opcional)",
          example: "auth_token_123"
        }
      }
    },
    PaymentResponse: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          example: true
        },
        data: {
          type: "object",
          properties: {
            orderId: {
              type: "string",
              example: "order456"
            },
            userId: {
              type: "string", 
              example: "user123"
            },
            amount: {
              type: "number",
              example: 2099.97
            },
            status: {
              type: "string",
              enum: ["pending", "approved", "rejected", "cancelled", "refunded"],
              example: "pending"
            },
            paymentUrl: {
              type: "string",
              example: "https://mercadopago.com/checkout/v1/redirect?pref_id=123456789"
            },
            paymentId: {
              type: "string",
              example: "mp_payment_123"
            },
            paymentMethod: {
              type: "string",
              example: "credit_card"
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    example: "Smartphone Samsung Galaxy"
                  },
                  description: {
                    type: "string",
                    example: "Smartphone Samsung Galaxy A54 128GB Preto"
                  },
                  quantity: {
                    type: "integer",
                    example: 2
                  },
                  unitPrice: {
                    type: "number",
                    example: 899.99
                  }
                }
              }
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00.000Z"
            },
            updatedAt: {
              type: "string",
              format: "date-time", 
              example: "2024-01-15T10:30:00.000Z"
            }
          }
        },
        _links: {
          type: "array",
          items: {
            type: "object",
            properties: {
              rel: {
                type: "string",
                example: "self"
              },
              href: {
                type: "string",
                example: "/api/payments/507f1f77bcf86cd799439011"
              },
              method: {
                type: "string",
                example: "GET"
              }
            }
          }
        },
        message: {
          type: "string",
          example: "Pagamento criado com sucesso"
        }
      }
    },
    WebhookRequest: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID da notificação",
          example: "12345"
        },
        live_mode: {
          type: "boolean",
          description: "Se está em modo produção",
          example: false
        },
        type: {
          type: "string",
          description: "Tipo da notificação",
          example: "payment"
        },
        date_created: {
          type: "string",
          format: "date-time",
          description: "Data de criação da notificação",
          example: "2024-01-15T10:30:00.000Z"
        },
        application_id: {
          type: "string",
          description: "ID da aplicação",
          example: "123456789"
        },
        user_id: {
          type: "string",
          description: "ID do usuário",
          example: "user123"
        },
        version: {
          type: "integer",
          description: "Versão da API",
          example: 1
        },
        api_version: {
          type: "string",
          description: "Versão da API",
          example: "v1"
        },
        action: {
          type: "string",
          description: "Ação executada",
          example: "payment.updated"
        },
        data: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID do pagamento",
              example: "mp_payment_123"
            }
          }
        }
      }
    },
    ErrorResponse: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          example: false
        },
        message: {
          type: "string",
          example: "Dados incompletos para criação do pagamento"
        },
        error: {
          type: "string",
          example: "userId, orderId, items e payer são obrigatórios"
        }
      }
    },
    UserPaymentsResponse: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          example: true
        },
        data: {
          type: "array",
          items: {
            $ref: "#/definitions/PaymentResponse"
          }
        },
        _links: {
          type: "array",
          items: {
            type: "object",
            properties: {
              rel: {
                type: "string",
                example: "next"
              },
              href: {
                type: "string",
                example: "/api/payments/user/user123?page=2&limit=10"
              },
              method: {
                type: "string",
                example: "GET"
              },
              description: {
                type: "string",
                example: "Próxima página"
              }
            }
          }
        },
        message: {
          type: "string",
          example: "5 pagamentos encontrados para o usuário"
        },
        _meta: {
          type: "object",
          properties: {
            pagination: {
              type: "object",
              properties: {
                page: {
                  type: "integer",
                  example: 1
                },
                limit: {
                  type: "integer",
                  example: 10
                },
                total: {
                  type: "integer",
                  example: 25
                },
                totalPages: {
                  type: "integer",
                  example: 3
                },
                hasNext: {
                  type: "boolean",
                  example: true
                },
                hasPrev: {
                  type: "boolean",
                  example: false
                }
              }
            },
            stats: {
              type: "object",
              properties: {
                pending: {
                  type: "integer",
                  example: 5
                },
                approved: {
                  type: "integer", 
                  example: 18
                },
                rejected: {
                  type: "integer",
                  example: 2
                }
              }
            },
            filters: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  example: "all"
                },
                startDate: {
                  type: "string",
                  format: "date",
                  example: "2024-01-01"
                },
                endDate: {
                  type: "string",
                  format: "date",
                  example: "2024-01-31"
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-KEY",
      },
    },
  },
};

const outputFile = "./src/config/swagger-output.json";
const endpointsFiles = ["./src/app.js"]; // Mudar para usar o app.js principal

swaggerAutogen(outputFile, endpointsFiles, doc)
  .then(() => {
    console.log("Documentação Swagger gerada com sucesso!");
    // Se estiver executando diretamente (não sendo importado)
    if (require.main === module) {
      console.log("Inicializando servidor...");
      require("./server.js");
    }
  })
  .catch((error) => {
    console.error("Erro ao gerar documentação Swagger:", error);
  });
