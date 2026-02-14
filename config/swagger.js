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
        url: "http://localhost:3000/api",
        description: "Local development server",
      },
      {
        url: "http://localhost:5000/api",
        description: "Alternative local server",
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
