import { Router } from 'express'
import { proteger } from '../middlewares/proteger.js'
import * as controller from '../controllers/medico.controller.js'

export const medicoRoutes = Router()

// Todas las rutas de médicos exigen token
medicoRoutes.use(proteger)

medicoRoutes.get('/', controller.obtenerTodos)
// IMPORTANTE: /perfil debe ir antes de /:id para que express no confunda 'perfil' con un id
medicoRoutes.get('/perfil', controller.obtenerPerfil)
medicoRoutes.get('/:id', controller.obtenerPorId)
medicoRoutes.get('/:id/pacientes', controller.obtenerPacientes)
