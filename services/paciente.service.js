import { Paciente } from '../models/paciente.model.js'
import { Ficha } from '../models/ficha.model.js'

export const crear = async (datos, medicoId) => {
  // Regla: el médico tratante lo decide el token, no el body.
  const { medico, ...datosValidados } = datos
  datosValidados.medico = medicoId

  const paciente = await Paciente.create(datosValidados)
  return paciente
}

export const obtenerMisPacientes = async (medicoId, filtro = {}) => {
  const query = { medico: medicoId, ...filtro }
  return Paciente.find(query).populate('medico', 'nombre especialidad email')
}

export const obtenerPorId = async (id) => {
  return Paciente.findById(id).populate('medico', 'nombre especialidad email')
}

export const actualizar = async (id, datos, medicoId) => {
  const paciente = await Paciente.findById(id)
  if (!paciente) {
    return { errorTipo: 'NO_EXISTE' }
  }

  // Regla de negocio: solo el médico tratante puede modificar
  if (paciente.medico.toString() !== medicoId) {
    return { errorTipo: 'NO_AUTORIZADO' }
  }

  // Se ignora cualquier campo medico enviado en el body para no alterar la relación
  const { medico, ...datosActualizar } = datos

  const pacienteActualizado = await Paciente.findByIdAndUpdate(
    id,
    datosActualizar,
    { new: true, runValidators: true }
  ).populate('medico', 'nombre especialidad email')

  return { paciente: pacienteActualizado }
}

export const eliminar = async (id, medicoId) => {
  const paciente = await Paciente.findById(id)
  if (!paciente) {
    return { errorTipo: 'NO_EXISTE' }
  }

  // Regla de negocio: solo el médico tratante puede eliminar
  if (paciente.medico.toString() !== medicoId) {
    return { errorTipo: 'NO_AUTORIZADO' }
  }

  await Paciente.findByIdAndDelete(id)
  return { eliminado: true }
}

// Desafío extra: Fichas clínicas
export const crearFicha = async (pacienteId, datos, medicoId) => {
  const paciente = await Paciente.findById(pacienteId)
  if (!paciente) {
    return { errorTipo: 'NO_EXISTE' }
  }

  // Solo el médico tratante puede registrar atenciones
  if (paciente.medico.toString() !== medicoId) {
    return { errorTipo: 'NO_AUTORIZADO' }
  }

  const ficha = await Ficha.create({
    paciente: pacienteId,
    medico: medicoId,
    diagnostico: datos.diagnostico,
    tratamiento: datos.tratamiento,
    fecha: datos.fecha || Date.now()
  })

  return { ficha }
}

export const obtenerFichas = async (pacienteId) => {
  const paciente = await Paciente.findById(pacienteId)
  if (!paciente) {
    return { errorTipo: 'NO_EXISTE' }
  }

  const fichas = await Ficha.find({ paciente: pacienteId })
    .sort({ fecha: -1 })
    .populate('medico', 'nombre especialidad')

  return { fichas }
}
