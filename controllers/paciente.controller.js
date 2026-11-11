import mongoose from 'mongoose'
import * as service from '../services/paciente.service.js'

export const crear = async (req, res, next) => {
  try {
    const paciente = await service.crear(req.body, req.medico.id)
    return res.status(201).json(paciente)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'El RUT ya está registrado' })
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}

export const obtenerMisPacientes = async (req, res, next) => {
  try {
    const { prevision } = req.query
    const filtro = {}
    if (prevision) {
      filtro.prevision = prevision
    }
    const pacientes = await service.obtenerMisPacientes(req.medico.id, filtro)
    return res.status(200).json(pacientes)
  } catch (err) {
    next(err)
  }
}

export const obtenerPorId = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de paciente inválido' })
    }

    const paciente = await service.obtenerPorId(id)
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }

    return res.status(200).json(paciente)
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID de paciente inválido' })
    }
    next(err)
  }
}

export const actualizar = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de paciente inválido' })
    }

    const resultado = await service.actualizar(id, req.body, req.medico.id)

    if (resultado.errorTipo === 'NO_EXISTE') {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }

    if (resultado.errorTipo === 'NO_AUTORIZADO') {
      return res.status(403).json({ error: 'No tienes permiso para modificar este paciente' })
    }

    return res.status(200).json(resultado.paciente)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'El RUT ya está registrado' })
    }
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}

export const eliminar = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de paciente inválido' })
    }

    const resultado = await service.eliminar(id, req.medico.id)

    if (resultado.errorTipo === 'NO_EXISTE') {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }

    if (resultado.errorTipo === 'NO_AUTORIZADO') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este paciente' })
    }

    return res.status(204).send()
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID de paciente inválido' })
    }
    next(err)
  }
}

// Desafío extra: Fichas clínicas
export const crearFicha = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de paciente inválido' })
    }

    if (!req.body.diagnostico) {
      return res.status(400).json({ error: 'El diagnóstico es obligatorio' })
    }

    const resultado = await service.crearFicha(id, req.body, req.medico.id)

    if (resultado.errorTipo === 'NO_EXISTE') {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }

    if (resultado.errorTipo === 'NO_AUTORIZADO') {
      return res.status(403).json({ error: 'No tienes permiso para registrar atención en este paciente' })
    }

    return res.status(201).json(resultado.ficha)
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}

export const obtenerFichas = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de paciente inválido' })
    }

    const resultado = await service.obtenerFichas(id)

    if (resultado.errorTipo === 'NO_EXISTE') {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }

    return res.status(200).json(resultado.fichas)
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'ID de paciente inválido' })
    }
    next(err)
  }
}
