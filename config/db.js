import mongoose from 'mongoose'

export const conectar = async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('conectado a la bd')
}
