export const errorHandler = (err, req, res, next) => {
  // Errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }

  // Errores de formato de ID (ObjectId inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Formato de ID inválido' })
  }

  // Conflictos de unicidad en MongoDB (e.g., email repetido, RUT repetido)
  if (err.code === 11000) {
    const campo = Object.keys(err.keyPattern || {})[0] || 'campo'
    return res.status(409).json({ error: `El ${campo} ya se encuentra registrado` })
  }

  const statusCode = err.statusCode || err.status || 500
  const mensaje = err.message || 'Error interno del servidor'

  return res.status(statusCode).json({ error: mensaje })
}
