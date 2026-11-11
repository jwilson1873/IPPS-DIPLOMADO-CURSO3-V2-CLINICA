import * as service from '../services/auth.service.js'

export const registrar = async (req, res, next) => {
  try {
    const { nombre, especialidad, email, password } = req.body

    if (!nombre || !especialidad || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }

    const { medico, token } = await service.registrar(req.body)
    return res.status(201).json({ medico, token })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'El email ya está registrado' })
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' })
    }

    const resultado = await service.login(email, password)
    if (!resultado) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    }

    return res.status(200).json(resultado)
  } catch (err) {
    next(err)
  }
}
