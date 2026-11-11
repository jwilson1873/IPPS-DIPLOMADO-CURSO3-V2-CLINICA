import mongoose from 'mongoose'

export const conectar = async () => {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('La variable MONGODB_URI no está definida en el entorno (.env)')
  }
  await mongoose.connect(uri)
  console.log('conectado a la bd')
}
