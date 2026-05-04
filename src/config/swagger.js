import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'BildyApp API',
      version: '1.0.0',
      description: 'API REST para gestión de albaranes, clientes y proyectos'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            status: { type: 'string', enum: ['pending', 'verified'] },
            company: { type: 'string' }
          }
        },
        Company: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            owner: { type: 'string' },
            name: { type: 'string' },
            cif: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                number: { type: 'string' },
                postal: { type: 'string' },
                city: { type: 'string' },
                province: { type: 'string' }
              }
            }
          }
        },
        Client: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            company: { type: 'string' },
            name: { type: 'string' },
            cif: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                number: { type: 'string' },
                postal: { type: 'string' },
                city: { type: 'string' },
                province: { type: 'string' }
              }
            },
            deleted: { type: 'boolean' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            company: { type: 'string' },
            client: { type: 'string' },
            name: { type: 'string' },
            projectCode: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                number: { type: 'string' },
                postal: { type: 'string' },
                city: { type: 'string' },
                province: { type: 'string' }
              }
            },
            email: { type: 'string' },
            notes: { type: 'string' },
            active: { type: 'boolean' },
            deleted: { type: 'boolean' }
          }
        },
        DeliveryNote: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            company: { type: 'string' },
            client: { type: 'string' },
            project: { type: 'string' },
            format: { type: 'string', enum: ['material', 'hours'] },
            description: { type: 'string' },
            workDate: { type: 'string', format: 'date-time' },
            material: { type: 'string' },
            quantity: { type: 'number' },
            unit: { type: 'string' },
            hours: { type: 'number' },
            workers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  hours: { type: 'number' }
                }
              }
            },
            signed: { type: 'boolean' },
            signedAt: { type: 'string', format: 'date-time' },
            signatureUrl: { type: 'string' },
            pdfUrl: { type: 'string' },
            deleted: { type: 'boolean' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);
