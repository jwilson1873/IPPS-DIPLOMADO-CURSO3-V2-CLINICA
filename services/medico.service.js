import { Medico } from '../models/medico.model.js'
import { Paciente } from '../models/paciente.model.js'

export const obtenerTodos = async (filtro = {}) => {
  return Medico.find(filtro).select('-password')
}

export const obtenerPorId = async (id) => {
  return Medico.findById(id).select('-password')
}

export const obtenerPacientesDeMedico = async (medicoId) => {
  const medico = await Medico.findById(medicoId)
  if (!medico) {
    return null
  }
  return Paciente.find({ medico: medicoId })
}
