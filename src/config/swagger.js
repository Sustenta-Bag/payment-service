const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Pagamentos",
      version: "1.0.0",
      description: "API RESTful para processamento de pagamentos com suporte a HATEOAS e JSON:API",
      contact: {
        name: "Suporte",
        email: "suporte@exemplo.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Servidor de desenvolvimento",
      },
    ],
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../controllers/*.js"),
    path.join(__dirname, "../app.js"),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
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
