import express from 'express'
import cors from 'cors'

import { conectar } from './config/db.js'
import { authRoutes } from './routes/auth.routes.js'
import { medicoRoutes } from './routes/medico.routes.js'
import { pacienteRoutes } from './routes/paciente.route.js'
import { errorHandler } from './middlewares/error.middleware.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/medicos', medicoRoutes)
app.use('/pacientes', pacienteRoutes)

// Middleware global de manejo de errores
app.use(errorHandler)

const PORT = process.env.PORT || 3001

// Solo inicia automáticamente si no estamos en entorno de testing
const esTest = process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test'))
if (!esTest) {
  await conectar()
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`)
  })
}
