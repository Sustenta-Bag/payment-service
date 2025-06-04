const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "API de Pagamentos",
    version: "1.0.0",
    description:
      "API RESTful para processamento de pagamentos com suporte a HATEOAS e JSON:API",
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
      name: "Webhooks",
      description: "Endpoints para receber notificações de pagamentos",
    },
    {
      name: "Health",
      description: "Endpoints para verificação de saúde do sistema",
    },
  ],
  components: {
    schemas: {
      Payment: {
        orderId: "",
        userId: "",
        amount: 0,
        status: "pending",
        paymentUrl: "",
        paymentId: "",
        paymentMethod: "",
        items: [
          {
            title: "",
            description: "",
            quantity: 0,
            unitPrice: 0,
          },
        ],
        createdAt: "",
        updatedAt: "",
      },
      Error: {
        success: false,
        message: "Mensagem de erro",
        error: "Detalhes do erro",
      },
    },
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
