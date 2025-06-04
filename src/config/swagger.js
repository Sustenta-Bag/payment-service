const swaggerUi = require("swagger-ui-express");
let swaggerFile;

try {
  swaggerFile = require("./swagger-output.json");
} catch (error) {
  console.warn(
    "Arquivo swagger-output.json não encontrado. Utilizando configuração padrão."
  );
  // Configuração de fallback caso o arquivo não exista
  swaggerFile = {
    openapi: "3.0.0",
    info: {
      title: "API de Pagamentos",
      version: "1.0.0",
      description: "API RESTful para processamento de pagamentos",
    },
  };
}

module.exports = (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerFile, {
      explorer: true,
      swaggerOptions: {
        docExpansion: "none",
        persistAuthorization: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
        displayRequestDuration: true,
      },
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "API RESTful de Pagamentos - Documentação",
    })
  );
};
