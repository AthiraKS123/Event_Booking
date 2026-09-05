const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EventBook Concurrency Engine API',
      version: '1.0.0',
      description: 'Production REST API specification for high-concurrency event booking, atomic seat holds, and JWT authentication.',
      contact: {
        name: 'Arya Dev',
        email: 'arya@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your 15-minute JWT Access Token obtained from /auth/login or /auth/register',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '66d12a4b89f3c1a2e4d56789' },
            name: { type: 'string', example: 'Arya Dev' },
            email: { type: 'string', example: 'arya@example.com' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          },
        },
        TicketTier: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66d12b7f89f3c1a2e4d56791' },
            name: { type: 'string', example: 'VIP' },
            price: { type: 'number', example: 200 },
            totalSeats: { type: 'number', example: 10 },
            availableSeats: { type: 'number', example: 10 },
          },
        },
        Event: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66d12b7f89f3c1a2e4d56790' },
            title: { type: 'string', example: 'Sunburn Festival Goa 2026' },
            description: { type: 'string', example: 'Exclusive high-concurrency electronic music festival' },
            venue: { type: 'string', example: 'Goa Beach Arena' },
            dateTime: { type: 'string', format: 'date-time', example: '2026-09-15T18:00:00.000Z' },
            category: { type: 'string', example: 'Music' },
            status: { type: 'string', example: 'published' },
            bannerImage: { type: 'string', example: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745' },
            ticketTiers: {
              type: 'array',
              items: { $ref: '#/components/schemas/TicketTier' },
            },
          },
        },
        SeatHold: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66d12e1089f3c1a2e4d56799' },
            user: { type: 'string', example: '66d12a4b89f3c1a2e4d56789' },
            event: { type: 'string', example: '66d12b7f89f3c1a2e4d56790' },
            tierId: { type: 'string', example: '66d12b7f89f3c1a2e4d56791' },
            tierName: { type: 'string', example: 'VIP' },
            quantity: { type: 'number', example: 2 },
            pricePerSeat: { type: 'number', example: 200 },
            totalAmount: { type: 'number', example: 400 },
            status: { type: 'string', enum: ['held', 'released', 'purchased'], example: 'held' },
            expiresAt: { type: 'string', format: 'date-time', example: '2026-08-30T17:00:00.000Z' },
          },
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new user or admin account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Arya Dev' },
                    email: { type: 'string', example: 'arya@example.com' },
                    password: { type: 'string', example: 'password123' },
                    role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Account registered successfully with JWT tokens' },
            400: { description: 'User already exists or missing fields' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login with credentials',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'arya@example.com' },
                    password: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful, returns JWT Access Token' },
            401: { description: 'Invalid email or password' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Authentication'],
          summary: 'Exchange Refresh Token for new Access Token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'New access token issued' },
            401: { description: 'Invalid or expired refresh token' },
          },
        },
      },
      '/events': {
        get: {
          tags: ['Event Engine'],
          summary: 'Get published events with search and category filtering',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category (e.g. Music, Tech)' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search keyword across title, venue, description' },
          ],
          responses: {
            200: { description: 'List of matching published events' },
          },
        },
      },
      '/events/{id}': {
        get: {
          tags: ['Event Engine'],
          summary: 'Get single event by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Event details and live tier capacities' },
            404: { description: 'Event not found' },
          },
        },
      },
      '/admin/events': {
        post: {
          tags: ['Admin Management'],
          summary: 'Create a new event with ticket tiers (Admin Only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'venue', 'dateTime', 'ticketTiers'],
                  properties: {
                    title: { type: 'string', example: 'Tech Summit 2026' },
                    description: { type: 'string', example: 'Node.js Concurrency Summit' },
                    venue: { type: 'string', example: 'Silicon Valley Convention Center' },
                    dateTime: { type: 'string', format: 'date-time', example: '2026-10-10T10:00:00.000Z' },
                    category: { type: 'string', example: 'Tech' },
                    ticketTiers: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', example: 'VIP' },
                          price: { type: 'number', example: 150 },
                          totalSeats: { type: 'number', example: 20 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Event created successfully' },
            403: { description: 'Forbidden - Admin role required' },
          },
        },
      },
      '/admin/events/{id}': {
        delete: {
          tags: ['Admin Management'],
          summary: 'Delete an event (Admin Only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Event deleted successfully' },
            403: { description: 'Forbidden - Admin role required' },
          },
        },
      },
      '/bookings/hold': {
        post: {
          tags: ['Seat Holding Engine'],
          summary: 'Hold seats for 10 minutes with atomic capacity lock',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['eventId', 'tierId', 'quantity'],
                  properties: {
                    eventId: { type: 'string', example: '66d12b7f89f3c1a2e4d56790' },
                    tierId: { type: 'string', example: '66d12b7f89f3c1a2e4d56791' },
                    quantity: { type: 'number', example: 2 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Seats held successfully for 10 minutes' },
            409: { description: 'Conflict - Over-hold atomic rejection (Not enough seats)' },
          },
        },
      },
      '/bookings/hold/my': {
        get: {
          tags: ['Seat Holding Engine'],
          summary: 'Get active seat holds for logged-in user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'List of active unexpired seat holds' },
          },
        },
      },
      '/bookings/hold/{holdId}': {
        delete: {
          tags: ['Seat Holding Engine'],
          summary: 'Release held seats back to public event pool',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'holdId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Seats released and capacity restored' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'EventBook Concurrency Engine API Docs',
  }));
};

module.exports = setupSwagger;
