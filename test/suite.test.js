process.env.NODE_ENV = 'test'

import { test, before, after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { app } from '../server.js'

let mongoServer
let server
let baseUrl
let tokenAna
let tokenCarlos
let idAna
let idCarlos
let idPaciente1
let idPaciente2

before(async () => {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri)

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port
      baseUrl = `http://127.0.0.1:${port}`
      resolve()
    })
  })
})

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
  await mongoose.disconnect()
  if (mongoServer) {
    await mongoServer.stop()
  }
})

describe('1. Autenticación y Médicos (/auth)', () => {
  it('POST /auth/registro: Registra a la Dra. Ana y devuelve 201 con { medico, token } sin password', async () => {
    const res = await fetch(`${baseUrl}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Ana Rojas',
        especialidad: 'Pediatría',
        email: 'ana@clinica.cl',
        password: 'password123'
      })
    })

    assert.equal(res.status, 201)
    const data = await res.json()
    assert.ok(data.token, 'Debe retornar un token')
    assert.ok(data.medico, 'Debe retornar el objeto medico')
    assert.equal(data.medico.nombre, 'Ana Rojas')
    assert.equal(data.medico.especialidad, 'Pediatría')
    assert.equal(data.medico.email, 'ana@clinica.cl')
    assert.equal(data.medico.password, undefined, 'El password no debe exponerse jamás')

    tokenAna = data.token
    idAna = data.medico._id
  })

  it('POST /auth/registro: Registra al Dr. Carlos (segundo médico)', async () => {
    const res = await fetch(`${baseUrl}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Carlos Soto',
        especialidad: 'Cardiología',
        email: 'carlos@clinica.cl',
        password: 'password456'
      })
    })

    assert.equal(res.status, 201)
    const data = await res.json()
    tokenCarlos = data.token
    idCarlos = data.medico._id
  })

  it('POST /auth/registro: Email repetido debe devolver 409', async () => {
    const res = await fetch(`${baseUrl}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Otra Ana',
        especialidad: 'Dermatología',
        email: 'ana@clinica.cl',
        password: 'password789'
      })
    })

    assert.equal(res.status, 409)
    const data = await res.json()
    assert.ok(data.error, 'Debe retornar un mensaje de error descriptivo')
  })

  it('POST /auth/registro: Faltan campos requeridos debe devolver 400', async () => {
    const res = await fetch(`${baseUrl}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Incompleto'
      })
    })

    assert.equal(res.status, 400)
    const data = await res.json()
    assert.ok(data.error)
  })

  it('POST /auth/login: Login exitoso devuelve 200 con { medico, token }', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ana@clinica.cl',
        password: 'password123'
      })
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.token)
    assert.equal(data.medico.email, 'ana@clinica.cl')
    assert.equal(data.medico.password, undefined)
  })

  it('POST /auth/login: Contraseña incorrecta devuelve 401', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ana@clinica.cl',
        password: 'clave_incorrecta'
      })
    })

    assert.equal(res.status, 401)
    const data = await res.json()
    assert.ok(data.error)
  })

  it('POST /auth/login: Falta email o password devuelve 400', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ana@clinica.cl' })
    })

    assert.equal(res.status, 400)
    const data = await res.json()
    assert.ok(data.error)
  })
})

describe('2. Seguridad y Rutas de Médicos (/medicos)', () => {
  it('Petición sin token devuelve 401', async () => {
    const res = await fetch(`${baseUrl}/medicos`)
    assert.equal(res.status, 401)
    const data = await res.json()
    assert.ok(data.error)
  })

  it('Petición con token inválido devuelve 401', async () => {
    const res = await fetch(`${baseUrl}/medicos`, {
      headers: { Authorization: 'Bearer token_invalido_xyz' }
    })
    assert.equal(res.status, 401)
    const data = await res.json()
    assert.ok(data.error)
  })

  it('GET /medicos: Lista todos los médicos', async () => {
    const res = await fetch(`${baseUrl}/medicos`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.length, 2)
    assert.equal(data[0].password, undefined)
    assert.equal(data[1].password, undefined)
  })

  it('GET /medicos?especialidad=Pediatría: Filtra por especialidad', async () => {
    const res = await fetch(`${baseUrl}/medicos?especialidad=Pediatría`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.length, 1)
    assert.equal(data[0].nombre, 'Ana Rojas')
  })

  it('GET /medicos?especialidad=Neurología: Especialidad sin médicos devuelve 200 con []', async () => {
    const res = await fetch(`${baseUrl}/medicos?especialidad=Neurología`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.deepEqual(data, [])
  })

  it('GET /medicos/perfil: Devuelve el médico autenticado', async () => {
    const res = await fetch(`${baseUrl}/medicos/perfil`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data._id, idAna)
    assert.equal(data.nombre, 'Ana Rojas')
    assert.equal(data.password, undefined)
  })

  it('GET /medicos/:id: Devuelve un médico por ID', async () => {
    const res = await fetch(`${baseUrl}/medicos/${idCarlos}`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data._id, idCarlos)
    assert.equal(data.nombre, 'Carlos Soto')
    assert.equal(data.password, undefined)
  })

  it('GET /medicos/:id: ID que no existe devuelve 404', async () => {
    const noExisteId = new mongoose.Types.ObjectId()
    const res = await fetch(`${baseUrl}/medicos/${noExisteId}`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })
    assert.equal(res.status, 404)
    const data = await res.json()
    assert.ok(data.error)
  })

  it('GET /medicos/:id: ID con formato inválido devuelve 400 sin caerse el servidor', async () => {
    const res = await fetch(`${baseUrl}/medicos/123-id-invalido`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })
    assert.equal(res.status, 400)
    const data = await res.json()
    assert.ok(data.error)
  })

  it('GET /medicos/:id/pacientes: Médico sin pacientes devuelve 200 con []', async () => {
    const res = await fetch(`${baseUrl}/medicos/${idAna}/pacientes`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.deepEqual(data, [])
  })

  it('GET /medicos/:id/pacientes: Médico no existente devuelve 404', async () => {
    const noExisteId = new mongoose.Types.ObjectId()
    const res = await fetch(`${baseUrl}/medicos/${noExisteId}/pacientes`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })
    assert.equal(res.status, 404)
    const data = await res.json()
    assert.ok(data.error)
  })
})

describe('3. API de Pacientes (/pacientes)', () => {
  it('GET /pacientes sin token devuelve 401', async () => {
    const res = await fetch(`${baseUrl}/pacientes`)
    assert.equal(res.status, 401)
  })

  it('POST /pacientes: Crea paciente 1 asociado a la Dra. Ana (ignora medico en body)', async () => {
    const res = await fetch(`${baseUrl}/pacientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAna}`
      },
      body: JSON.stringify({
        nombre: 'Pedro Pérez',
        rut: '12.345.678-9',
        fechaNacimiento: '1990-05-15',
        prevision: 'Fonasa',
        telefono: '+56911112222',
        email: 'PEDRO@GMAIL.COM',
        medico: idCarlos // ¡Debe ser ignorado!
      })
    })

    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.nombre, 'Pedro Pérez')
    assert.equal(data.rut, '12.345.678-9')
    assert.equal(data.prevision, 'Fonasa')
    assert.equal(data.email, 'pedro@gmail.com', 'Debe normalizar email a minúsculas')
    assert.equal(data.medico.toString(), idAna.toString(), 'El médico tratante debe ser el del token, no el del body')

    idPaciente1 = data._id
  })

  it('POST /pacientes: Crea paciente 2 con Isapre para Dra. Ana', async () => {
    const res = await fetch(`${baseUrl}/pacientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAna}`
      },
      body: JSON.stringify({
        nombre: 'María Gómez',
        rut: '18.765.432-1',
        fechaNacimiento: '1995-10-20',
        prevision: 'Isapre',
        telefono: '+56933334444'
      })
    })

    assert.equal(res.status, 201)
    const data = await res.json()
    idPaciente2 = data._id
  })

  it('POST /pacientes: RUT repetido devuelve 409', async () => {
    const res = await fetch(`${baseUrl}/pacientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`
      },
      body: JSON.stringify({
        nombre: 'Otro Paciente',
        rut: '12.345.678-9', // Mismo RUT que Paciente 1
        fechaNacimiento: '1985-01-01',
        prevision: 'Fonasa'
      })
    })

    assert.equal(res.status, 409)
    const data = await res.json()
    assert.ok(data.error)
  })

  it('POST /pacientes: Previsión inválida devuelve 400', async () => {
    const res = await fetch(`${baseUrl}/pacientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAna}`
      },
      body: JSON.stringify({
        nombre: 'Paciente Invalido',
        rut: '99.999.999-9',
        fechaNacimiento: '2000-01-01',
        prevision: 'SeguroPrivadoNoValido'
      })
    })

    assert.equal(res.status, 400)
    const data = await res.json()
    assert.ok(data.error)
  })

  it('GET /pacientes: "Mis pacientes" de la Dra. Ana devuelve sus 2 pacientes', async () => {
    const res = await fetch(`${baseUrl}/pacientes`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.length, 2)
  })

  it('GET /pacientes?prevision=Isapre: Filtra mis pacientes por previsión', async () => {
    const res = await fetch(`${baseUrl}/pacientes?prevision=Isapre`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.length, 1)
    assert.equal(data[0].nombre, 'María Gómez')
    assert.equal(data[0].prevision, 'Isapre')
  })

  it('GET /pacientes: "Mis pacientes" del Dr. Carlos devuelve []', async () => {
    const res = await fetch(`${baseUrl}/pacientes`, {
      headers: { Authorization: `Bearer ${tokenCarlos}` }
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.deepEqual(data, [], 'El Dr. Carlos no tiene pacientes registrados aún')
  })

  it('GET /medicos/:id/pacientes: Devuelve los pacientes del médico indicado', async () => {
    const res = await fetch(`${baseUrl}/medicos/${idAna}/pacientes`, {
      headers: { Authorization: `Bearer ${tokenCarlos}` }
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.length, 2)
  })

  it('GET /pacientes/:id: Cualquier médico autenticado puede consultar a un paciente', async () => {
    const res = await fetch(`${baseUrl}/pacientes/${idPaciente1}`, {
      headers: { Authorization: `Bearer ${tokenCarlos}` }
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data._id, idPaciente1)
    assert.equal(data.nombre, 'Pedro Pérez')
    // Verifica bonus populate
    assert.ok(data.medico)
    assert.equal(data.medico.nombre, 'Ana Rojas')
    assert.equal(data.medico.password, undefined)
  })

  it('GET /pacientes/:id: Paciente no existe devuelve 404', async () => {
    const noExisteId = new mongoose.Types.ObjectId()
    const res = await fetch(`${baseUrl}/pacientes/${noExisteId}`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })

    assert.equal(res.status, 404)
    const data = await res.json()
    assert.ok(data.error)
  })

  it('GET /pacientes/:id: ID con formato inválido devuelve 400', async () => {
    const res = await fetch(`${baseUrl}/pacientes/abc-123`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })

    assert.equal(res.status, 400)
    const data = await res.json()
    assert.ok(data.error)
  })

  it('PUT /pacientes/:id: Dr. Carlos (no tratante) intenta modificar -> devuelve 403', async () => {
    const res = await fetch(`${baseUrl}/pacientes/${idPaciente1}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`
      },
      body: JSON.stringify({
        nombre: 'Pedro Modificado por Carlos'
      })
    })

    assert.equal(res.status, 403, 'Debe devolver 403 cuando el médico no es el tratante')
    const data = await res.json()
    assert.ok(data.error)

    // Verificar que el paciente quedó intacto
    const checkRes = await fetch(`${baseUrl}/pacientes/${idPaciente1}`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })
    const checkData = await checkRes.json()
    assert.equal(checkData.nombre, 'Pedro Pérez', 'El paciente debe permanecer intacto')
  })

  it('PUT /pacientes/:id: Dra. Ana (médico tratante) actualiza al paciente -> devuelve 200', async () => {
    const res = await fetch(`${baseUrl}/pacientes/${idPaciente1}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAna}`
      },
      body: JSON.stringify({
        telefono: '+56999998888',
        medico: idCarlos // No debe poder cambiar de médico
      })
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.telefono, '+56999998888')
    assert.equal(data.medico._id.toString(), idAna.toString(), 'El médico tratante no debe ser alterado')
  })

  it('PUT /pacientes/:id: Validaciones corren en PUT -> devuelve 400', async () => {
    const res = await fetch(`${baseUrl}/pacientes/${idPaciente1}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAna}`
      },
      body: JSON.stringify({
        prevision: 'PrevisionInvalida'
      })
    })

    assert.equal(res.status, 400)
    const data = await res.json()
    assert.ok(data.error)
  })

  it('DELETE /pacientes/:id: Dr. Carlos (no tratante) intenta eliminar -> devuelve 403', async () => {
    const res = await fetch(`${baseUrl}/pacientes/${idPaciente2}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenCarlos}` }
    })

    assert.equal(res.status, 403)
    const data = await res.json()
    assert.ok(data.error)

    // Verificar que sigue existiendo
    const checkRes = await fetch(`${baseUrl}/pacientes/${idPaciente2}`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })
    assert.equal(checkRes.status, 200)
  })

  it('DELETE /pacientes/:id: Dra. Ana (médico tratante) elimina -> devuelve 204 sin cuerpo', async () => {
    const res = await fetch(`${baseUrl}/pacientes/${idPaciente2}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAna}` }
    })

    assert.equal(res.status, 204)
    const text = await res.text()
    assert.equal(text, '')

    // Verificar que ya no existe (404)
    const checkRes = await fetch(`${baseUrl}/pacientes/${idPaciente2}`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })
    assert.equal(checkRes.status, 404)
  })
})

describe('4. Desafío Extra: Fichas Clínicas (/pacientes/:id/fichas)', () => {
  it('POST /pacientes/:id/fichas: Dr. Carlos (no tratante) intenta agregar ficha -> devuelve 403', async () => {
    const res = await fetch(`${baseUrl}/pacientes/${idPaciente1}/fichas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`
      },
      body: JSON.stringify({
        diagnostico: 'Gripe estacional',
        tratamiento: 'Reposo e hidratación'
      })
    })

    assert.equal(res.status, 403)
    const data = await res.json()
    assert.ok(data.error)
  })

  it('POST /pacientes/:id/fichas: Dra. Ana (médico tratante) registra atención -> devuelve 201', async () => {
    const res = await fetch(`${baseUrl}/pacientes/${idPaciente1}/fichas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAna}`
      },
      body: JSON.stringify({
        diagnostico: 'Faringitis aguda',
        tratamiento: 'Amoxicilina 500mg cada 8 horas por 7 días'
      })
    })

    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.diagnostico, 'Faringitis aguda')
    assert.equal(data.tratamiento, 'Amoxicilina 500mg cada 8 horas por 7 días')
    assert.equal(data.paciente.toString(), idPaciente1.toString())
    assert.equal(data.medico.toString(), idAna.toString())
  })

  it('POST /pacientes/:id/fichas: Falta diagnóstico -> devuelve 400', async () => {
    const res = await fetch(`${baseUrl}/pacientes/${idPaciente1}/fichas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAna}`
      },
      body: JSON.stringify({
        tratamiento: 'Solo tratamiento sin diagnostico'
      })
    })

    assert.equal(res.status, 400)
    const data = await res.json()
    assert.ok(data.error)
  })

  it('GET /pacientes/:id/fichas: Devuelve historial con datos del médico poblados', async () => {
    const res = await fetch(`${baseUrl}/pacientes/${idPaciente1}/fichas`, {
      headers: { Authorization: `Bearer ${tokenAna}` }
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(Array.isArray(data))
    assert.equal(data.length, 1)
    assert.equal(data[0].diagnostico, 'Faringitis aguda')
    assert.ok(data[0].medico)
    assert.equal(data[0].medico.nombre, 'Ana Rojas')
    assert.equal(data[0].medico.password, undefined)
  })
})
