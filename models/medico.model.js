import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const medicoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  especialidad: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
}, { timestamps: true })

medicoSchema.pre('save', async function () {
  if (!this.isModified('password')) return

  this.password = await bcrypt.hash(this.password, 10)
})

medicoSchema.methods.compararPassword = function (passwordPlano) {
  return bcrypt.compare(passwordPlano, this.password)
}

medicoSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

export const Medico = mongoose.model(
  'Medico',
  medicoSchema,
  'medicos'
)
