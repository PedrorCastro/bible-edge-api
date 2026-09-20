import fastify from 'fastify'
import cors from '@fastify/cors' // <--- ADICIONADO
import { ZodError } from 'zod'
import { env } from './utils/env'
import { bibleRoutes } from './controllers/routes'

export const app = fastify()

// ADICIONADO: Liberar acesso para o iPad e Navegadores
app.register(cors, { 
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
})

app.register(bibleRoutes)

app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation error',
      issues: error.format(),
    })
  }
  if (env.NODE_ENV !== 'production') {
    console.error(error)
  }
  return reply.status(500).send({
    message: 'Internal server error',
  })
})