import { Router } from 'express'
import { proteger } from '../middlewares/proteger.js'
import * as controller from '../controllers/paciente.controller.js'

export const pacienteRoutes = Router()

// Todas las rutas de pacientes exigen token
pacienteRoutes.use(proteger)

pacienteRoutes.post('/', controller.crear)
pacienteRoutes.get('/', controller.obtenerMisPacientes)
pacienteRoutes.get('/:id', controller.obtenerPorId)
pacienteRoutes.put('/:id', controller.actualizar)
pacienteRoutes.delete('/:id', controller.eliminar)

// Desafío extra: Fichas clínicas
pacienteRoutes.post('/:id/fichas', controller.crearFicha)
pacienteRoutes.get('/:id/fichas', controller.obtenerFichas)
