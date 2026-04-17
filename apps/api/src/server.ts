import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { ZodError } from 'zod'

import { HttpError } from './errors.js'
import { registerEventRoutes } from './routes/events.js'
import { registerHealthRoute } from './routes/health.js'
import { registerSeriesRoutes } from './routes/series.js'

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })

  await app.register(cors, {
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',')
  })

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'When Whales Move API',
        version: '0.1.0'
      }
    }
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs'
  })

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      reply.status(error.statusCode).send({ error: error.message, details: error.details })
      return
    }
    if (error instanceof ZodError) {
      reply.status(400).send({ error: 'Validation failed', details: error.issues })
      return
    }
    app.log.error(error)
    reply.status(500).send({ error: 'Internal error' })
  })

  await registerHealthRoute(app)
  await registerEventRoutes(app)
  await registerSeriesRoutes(app)

  return app
}
