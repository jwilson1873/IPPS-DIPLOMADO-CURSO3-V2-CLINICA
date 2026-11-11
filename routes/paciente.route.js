import { Router } from 'express'
import { proteger } from '../middlewares/proteger.js'

export const pacienteRoutes = Router()

pacienteRoutes.use(proteger) // de aquí abajo, todo exige token

pacienteRoutes.post('/', (req, res) => {
  res.json({ mensaje: 'Pudiste pasar, eres un dctr' })
})
pacienteRoutes.get('/', (req, res) => {
  res.json({ mensaje: 'Pudiste pasar, eres un dctr' })
})
pacienteRoutes.get('/:id', (req, res) => {
  res.json({ mensaje: 'Pudiste pasar, eres un dctr' })
})
