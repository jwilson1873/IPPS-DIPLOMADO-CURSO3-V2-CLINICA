import mongoose from 'mongoose'
import * as service from '../services/medico.service.js'

export const obtenerTodos = async (req, res, next) => {
  try {
    const { especialidad } = req.query
    const filtro = {}
    if (especialidad) {
      filtro.especialidad = new RegExp(`^${especialidad.trim()}$`, 'i')
    }
    const medicos = await service.obtenerTodos(filtro)
    return res.status(200).json(medicos)
  } catch (err) {
    next(err)
  }
}

export const obtenerPerfil = async (req, res, next) => {
  try {
    const medico = await service.obtenerPorId(req.medico.id)
    if (!medico) {
      return res.status(404).json({ error: 'Médico no encontrado' })
    }
    return res.status(200).json(medico)
  } catch (err) {
    next(err)
  }
}

export const obtenerPorId = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de médico inválido' })
    }
    const medico = await service.obtenerPorId(id)
    if (!medico) {
      return res.status(404).json({ error: 'Médico no encontrado' })
    }
    return res.status(200).json(medico)
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID de médico inválido' })
    }
    next(err)
  }
}

export const obtenerPacientes = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de médico inválido' })
    }
    const pacientes = await service.obtenerPacientesDeMedico(id)
    if (pacientes === null) {
      return res.status(404).json({ error: 'Médico no encontrado' })
    }
    return res.status(200).json(pacientes)
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID de médico inválido' })
    }
    next(err)
  }
}
