const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Competition Platform API",
      version: "1.0.0",
      description: "API for managing competitions, categories, and registrations",
    },
    servers: [
      {
        url: `${process.env.BACKEND_URL || "http://localhost:5000"}/api`,
        description: "API Server",
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
