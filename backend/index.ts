import fastify from 'fastify'
import { tdRoutes } from './routes/td-routes.js'

const server = fastify()

server.register(tdRoutes)

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})