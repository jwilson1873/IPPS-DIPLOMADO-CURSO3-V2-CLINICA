# 🏥 Sistema de Gestión Clínica - API REST

API REST para la gestión de médicos, pacientes y fichas clínicas desarrollada con **Node.js**, **Express** y **MongoDB (Mongoose)**, implementando autenticación mediante **JWT**, control de acceso basado en reglas de negocio y arquitectura en capas: `routes → controllers → services → models`.

Proyecto correspondiente a la **Evaluación Integradora · Clínica** del **Diplomado · Módulo 3 · Backend y APIs REST** del **Instituto Profesional San Sebastián**.

---

## 📹 Video de Demostración y Explicación

> **Enlace al video en YouTube:**  
> 👉 **[VER VIDEO EN YOUTUBE](https://www.youtube.com/watch?v=TU_ENLACE_AQUI)** *(Reemplazar con tu enlace final)*

---

## 📋 Tabla de Contenidos

1. [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
2. [Puesta en Marcha](#-puesta-en-marcha)
3. [Variables de Entorno](#-variables-de-entorno)
4. [Ejecución de Pruebas](#-ejecución-de-pruebas)
5. [Documentación de la API](#-documentación-de-la-api)
   - [Autenticación (`/auth`)](#autenticación-auth)
   - [Médicos (`/medicos`)](#médicos-medicos)
   - [Pacientes (`/pacientes`)](#pacientes-pacientes)
   - [Fichas Clínicas (`/pacientes/:id/fichas`) [Desafío Extra]](#fichas-clínicas-desafío-extra)
6. [Reglas de Negocio y Seguridad](#-reglas-de-negocio-y-seguridad)
7. [Errores Corregidos en Parte 0](#-errores-corregidos-en-la-parte-0)
8. [Guía para la Demostración en Postman](#-guía-para-la-demostración-en-postman)

---

## 🏛️ Arquitectura del Proyecto

El proyecto sigue una separación estricta de responsabilidades en 4 capas:

```
IPPS-DIPLOMADO-CURSO3-V2-CLINICA/
├── config/
│   ├── db.js                 # Conexión a MongoDB usando process.env.MONGODB_URI
│   └── jwt.js                # Secret y tiempo de expiración del token JWT
├── controllers/
│   ├── auth.controller.js    # Manejo de peticiones HTTP para registro y login
│   ├── medico.controller.js  # Controladores de consulta de médicos y pacientes
│   └── paciente.controller.js# Controladores del CRUD de pacientes y fichas
├── middlewares/
│   ├── error.middleware.js   # Manejador global de errores (400, 404, 409, 500)
│   └── proteger.js           # Validación de token Bearer JWT -> req.medico
├── models/
│   ├── ficha.model.js        # Esquema Mongoose de Ficha Clínica
│   ├── medico.model.js       # Esquema Mongoose de Médico (hash bcrypt y toJSON)
│   └── paciente.model.js     # Esquema Mongoose de Paciente (validaciones y ref a Medico)
├── routes/
│   ├── auth.routes.js        # Rutas públicas /auth/registro y /auth/login
│   ├── medico.routes.js      # Rutas protegidas /medicos
│   └── paciente.route.js     # Rutas protegidas /pacientes y /pacientes/:id/fichas
├── services/
│   ├── auth.service.js       # Lógica de registro, login y firma de JWT
│   ├── medico.service.js     # Consultas a la base de datos para médicos
│   └── paciente.service.js   # Lógica de negocio y persistencia de pacientes y fichas
├── test/
│   └── suite.test.js         # Suite de pruebas automatizadas (39 tests E2E)
├── .env.example              # Plantilla de variables de entorno
├── .gitignore                # Ignora node_modules y .env (sube yarn.lock)
├── package.json              # Configurado con "type": "module" y script "dev"
├── server.js                 # Punto de entrada de la aplicación Express
└── README.md                 # Documentación completa del proyecto
```

---

## 🚀 Puesta en Marcha

### Requisitos previos
- **Node.js** v20.0.0 o superior (compatible con `--env-file` y `--watch`).
- **Yarn** v1.22+ o **npm**.
- Una instancia de **MongoDB** (local o cluster en MongoDB Atlas).

### Pasos de instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/jwilson1873/IPPS-DIPLOMADO-CURSO3-V2-CLINICA.git
   cd IPPS-DIPLOMADO-CURSO3-V2-CLINICA
   ```

2. **Instalar dependencias:**
   ```bash
   yarn
   ```
   *(O `npm install`)*

3. **Configurar el archivo `.env`:**
   Copia la plantilla `.env.example` para crear tu `.env`:
   ```bash
   cp .env.example .env
   ```
   Abre `.env` y define tu cadena de conexión a MongoDB y el puerto:
   ```env
   MONGODB_URI=mongodb+srv://USUARIO:CLAVE@TU-CLUSTER.mongodb.net/clinica
   PORT=3001
   ```

4. **Iniciar el servidor en modo desarrollo:**
   ```bash
   yarn dev
   ```
   El servidor arrancará con reinicio automático (`--watch`) y cargará las variables de entorno:
   ```
   conectado a la bd
   Servidor escuchando en http://localhost:3001
   ```

---

## ⚙️ Variables de Entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `MONGODB_URI` | Cadena de conexión a la base de datos MongoDB | `mongodb+srv://admin:pass@cluster.mongodb.net/clinica` |
| `PORT` | Puerto de escucha de la API (por defecto: `3001`) | `3001` |

> ⚠️ **Nota de Seguridad:** El archivo `.env` se encuentra excluido del control de versiones a través de `.gitignore`. **Nunca** subas tus contraseñas reales a GitHub.

---

## 🧪 Ejecución de Pruebas

El proyecto cuenta con una suite completa de **39 pruebas automatizadas** que validan todos los endpoints, flujos de autenticación, autorizaciones y casos borde sin requerir un cluster externo (utiliza base de datos en memoria):

```bash
yarn test
```

---

## 📡 Documentación de la API

Todas las respuestas de error utilizan el formato JSON estándar:
```json
{
  "error": "Descripción detallada del error"
}
```

### Autenticación (`/auth`)

Rutas públicas para registro e inicio de sesión.

#### 1. Registrar Médico
- **Método / Ruta:** `POST /auth/registro`
- **Body (JSON):**
  ```json
  {
    "nombre": "Dra. Ana Rojas",
    "especialidad": "Pediatría",
    "email": "ana@clinica.cl",
    "password": "password123"
  }
  ```
- **Respuestas:**
  - `201 Created`: Médico creado exitosamente. Retorna `{ medico, token }`.
    *(La contraseña jamás aparece en la respuesta gracias al método `toJSON` del modelo)*.
  - `400 Bad Request`: Faltan datos requeridos o validación fallida.
  - `409 Conflict`: El email ya se encuentra registrado.

#### 2. Iniciar Sesión (Login)
- **Método / Ruta:** `POST /auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "ana@clinica.cl",
    "password": "password123"
  }
  ```
- **Respuestas:**
  - `200 OK`: Retorna `{ medico, token }`.
  - `400 Bad Request`: Falta email o contraseña.
  - `401 Unauthorized`: Email o contraseña incorrectos.

---

### Médicos (`/medicos`)

*Todas las rutas de médicos requieren el encabezado `Authorization: Bearer <token>`.*

#### 1. Listar Médicos
- **Método / Ruta:** `GET /medicos`
- **Parámetros de consulta (Query params):**
  - `?especialidad=Pediatría` *(opcional)*: Filtra por especialidad.
- **Respuestas:**
  - `200 OK`: Array de médicos `[...]` (o `[]` si no hay coincidencias).

#### 2. Obtener Perfil del Médico Autenticado
- **Método / Ruta:** `GET /medicos/perfil`
- **Descripción:** Devuelve los datos del médico que realizó la petición (obtenido del token).
- **Respuestas:**
  - `200 OK`: Objeto con los datos del médico.
  - `404 Not Found`: Si el médico del token ya no existe en la base de datos.

#### 3. Obtener Médico por ID
- **Método / Ruta:** `GET /medicos/:id`
- **Respuestas:**
  - `200 OK`: Objeto médico.
  - `400 Bad Request`: Formato de ID inválido.
  - `404 Not Found`: Médico no encontrado.

#### 4. Listar Pacientes de un Médico
- **Método / Ruta:** `GET /medicos/:id/pacientes`
- **Respuestas:**
  - `200 OK`: Lista de pacientes asignados a ese médico (`[]` si no tiene).
  - `400 Bad Request`: Formato de ID inválido.
  - `404 Not Found`: Médico no encontrado.

---

### Pacientes (`/pacientes`)

*Todas las rutas de pacientes requieren el encabezado `Authorization: Bearer <token>`.*

#### 1. Crear Paciente
- **Método / Ruta:** `POST /pacientes`
- **Body (JSON):**
  ```json
  {
    "nombre": "Pedro Pérez",
    "rut": "12.345.678-9",
    "fechaNacimiento": "1990-05-15",
    "prevision": "Fonasa",
    "telefono": "+56912345678",
    "email": "pedro@correo.cl"
  }
  ```
- **Respuestas:**
  - `201 Created`: Paciente creado. El campo `medico` se asigna automáticamente con el ID del médico autenticado (cualquier campo `medico` enviado en el body es descartado).
  - `400 Bad Request`: Faltan campos requeridos o valor de previsión no permitido (`Fonasa`, `Isapre`, `Particular`).
  - `409 Conflict`: El RUT ya está registrado en el sistema.

#### 2. Listar Mis Pacientes
- **Método / Ruta:** `GET /pacientes`
- **Parámetros de consulta (Query params):**
  - `?prevision=Isapre` *(opcional)*: Filtra además por tipo de previsión.
- **Respuestas:**
  - `200 OK`: Lista con los pacientes donde el médico tratante es el usuario autenticado.

#### 3. Consultar Paciente por ID
- **Método / Ruta:** `GET /pacientes/:id`
- **Descripción:** Cualquier médico autenticado puede consultar la ficha general de un paciente.
- **Respuestas:**
  - `200 OK`: Objeto paciente con los datos de su médico poblados (`populate`).
  - `400 Bad Request`: ID inválido.
  - `404 Not Found`: Paciente no existe.

#### 4. Modificar Paciente
- **Método / Ruta:** `PUT /pacientes/:id`
- **Body (JSON):**
  ```json
  {
    "telefono": "+56987654321",
    "prevision": "Isapre"
  }
  ```
- **Respuestas:**
  - `200 OK`: Paciente actualizado.
  - `400 Bad Request`: Datos inválidos o ID con formato erróneo.
  - `403 Forbidden`: Si el médico autenticado **no es el médico tratante** del paciente.
  - `404 Not Found`: Paciente no existe.
  - `409 Conflict`: Si se intenta actualizar el RUT a uno que ya pertenece a otro paciente.

#### 5. Eliminar Paciente
- **Método / Ruta:** `DELETE /pacientes/:id`
- **Respuestas:**
  - `204 No Content`: Paciente eliminado exitosamente (respuesta sin cuerpo).
  - `400 Bad Request`: ID inválido.
  - `403 Forbidden`: Si el médico autenticado **no es el médico tratante**.
  - `404 Not Found`: Paciente no existe.

---

### Fichas Clínicas [Desafío Extra]

#### 1. Registrar Atención Médica
- **Método / Ruta:** `POST /pacientes/:id/fichas`
- **Body (JSON):**
  ```json
  {
    "diagnostico": "Faringitis aguda",
    "tratamiento": "Amoxicilina 500mg cada 8 horas por 7 días"
  }
  ```
- **Respuestas:**
  - `201 Created`: Atención registrada.
  - `400 Bad Request`: Diagnóstico faltante o ID inválido.
  - `403 Forbidden`: Solo el médico tratante del paciente puede registrar atenciones clínicas.
  - `404 Not Found`: Paciente no existe.

#### 2. Consultar Historial de Atenciones
- **Método / Ruta:** `GET /pacientes/:id/fichas`
- **Respuestas:**
  - `200 OK`: Lista cronológica de atenciones (de la más reciente a la más antigua), con el médico de cada atención poblado (`nombre`, `especialidad`).
  - `404 Not Found`: Paciente no existe.

---

## 🔒 Reglas de Negocio y Seguridad

1. **Relación Paciente → Médico (`ref: 'Medico'`):**  
   En la base de datos, el documento del paciente almacena el `_id` de su médico tratante (`Schema.Types.ObjectId`). Para comparar la identidad en controladores o servicios se utiliza siempre `.toString()`:
   ```javascript
   if (paciente.medico.toString() !== req.medico.id) {
     return res.status(403).json({ error: 'No tienes permiso para modificar este paciente' })
   }
   ```
2. **El médico tratante lo decide el token, jamás el body:**  
   Al crear (`POST`) o editar (`PUT`), cualquier campo `medico` proveniente del cuerpo de la petición es desestructurado y descartado, garantizando que nadie pueda reasignar pacientes arbitrariamente.
3. **Privacidad de contraseñas:**  
   El modelo `Medico` tiene implementado un método `toJSON` que elimina el campo `password` de toda serialización JSON, garantizando que nunca sea expuesto en respuestas de registro, login, listas o consultas individuales.

---

## 🛠️ Errores Corregidos en la Parte 0

Al recibir el repositorio de la clase, el servidor no iniciaba debido a los siguientes fallos:

1. **Módulo ES (`package.json`):**  
   Faltaba la propiedad `"type": "module"`, lo que provocaba un error al interpretar las sentencias `import/export`.
2. **Ruta relativa en importación de base de datos (`server.js`):**  
   Tenía `import { conectar } from 'config/db.js'`. En ESM de Node.js, las importaciones locales deben comenzar con `./` (`import { conectar } from './config/db.js'`).
3. **Discrepancia en nombre de archivo de rutas (`server.js`):**  
   `server.js` importaba `./routes/auth.route.js`, pero el archivo en el disco se llamaba `auth.routes.js`.
4. **Falta de exportación en rutas (`routes/auth.routes.js`):**  
   `authRoutes` se declaraba pero no se exportaba (`export const authRoutes = Router()`).
5. **Importación sin extensión `.js` (`routes/paciente.route.js`):**  
   Tenía `import { proteger } from "../middlewares/proteger"`. En ESM es obligatorio incluir la extensión (`.js`).
6. **Falta de librería de encriptación (`models/medico.model.js`):**  
   El modelo utilizaba `bcrypt.hash()` y `bcrypt.compare()` en sus middlewares y métodos, pero `bcrypt` no estaba importado. Se agregó `import bcrypt from 'bcryptjs'`.
7. **Línea de texto literal en modelo (`models/ficha.model.js`):**  
   La primera línea del archivo contenía el texto plano `models/ficha.model.js`, lo que provocaba un `SyntaxError`. Además, faltaba importar `mongoose` y exportar el modelo.
8. **URL cableada y error de sintaxis en base de datos (`config/db.js`):**  
   La constante `MONGODB_URI` estaba vacía en el código y había un error tipográfico `consolelog` (sin punto). Se corrigió para leer `process.env.MONGODB_URI` y usar `console.log`.
9. **Configuración de `.gitignore`:**  
   Se ajustó para ignorar `.env` y `node_modules`, asegurando que `yarn.lock` sí sea versionado en Git.

---

## 🎬 Guía para la Demostración en Postman

Se incluye en el repositorio la colección oficial lista para importar en Postman:
- 📁 **Colección de Postman:** [`postman/clinica_postman_collection.json`](file:///c:/Users/jwilson/Desktop/Curso_IPSS/Modulo%203/IPPS-DIPLOMADO-CURSO3-V2-CLINICA/postman/clinica_postman_collection.json)
- 📁 **Variables de Entorno:** [`postman/clinica_environment.json`](file:///c:/Users/jwilson/Desktop/Curso_IPSS/Modulo%203/IPPS-DIPLOMADO-CURSO3-V2-CLINICA/postman/clinica_environment.json)
- 📁 **Archivo HTTP para VS Code:** [`requests.http`](file:///c:/Users/jwilson/Desktop/Curso_IPSS/Modulo%203/IPPS-DIPLOMADO-CURSO3-V2-CLINICA/requests.http) (para usar con la extensión *REST Client*).

### Cómo importar en Postman:
1. Abre Postman y haz clic en **Import** (arriba a la izquierda).
2. Selecciona y arrastra el archivo `postman/clinica_postman_collection.json`.
3. Verás la colección **"Clínica API - Evaluación Integradora IPSS"**.
4. Abre la primera carpeta: **`00. Flujo Video (Rubrica Paso a Paso)`**.
5. Las peticiones cuentan con **scripts automáticos de prueba (Test Scripts)** que capturan los tokens (`tokenAna`, `tokenCarlos`) y los IDs (`idAna`, `idCarlos`, `idPaciente1`) automáticamente en las variables de la colección a medida que las ejecutas, por lo que **no necesitas copiar ni pegar tokens manualmente** durante la grabación.

### Flujo paso a paso para el video (5 a 8 minutos):

1. **Registrar a dos médicos:**
   - Ejecuta `Paso 1a - Registrar Médico 1 (Dra. Ana)` (`POST /auth/registro`). Status: **`201 Created`**.
   - Ejecuta `Paso 1b - Registrar Médico 2 (Dr. Carlos)` (`POST /auth/registro`). Status: **`201 Created`**.
2. **Iniciar sesión:**
   - Ejecuta `Paso 1c - Iniciar Sesión con Dra. Ana` (`POST /auth/login`). Status: **`200 OK`**.
3. **Petición sin token:**
   - Ejecuta `Paso 2 - Petición SIN Token (Seguridad)` (`GET /pacientes`). Status: **`401 Unauthorized`**.
4. **Crear paciente con Dra. Ana:**
   - Ejecuta `Paso 3a - Crear Paciente con Dra. Ana` (`POST /pacientes`). Status: **`201 Created`**.
   - Muestra cómo en el body se envió el id del Dr. Carlos, pero la API lo ignoró y asignó a la Dra. Ana.
5. **Consultar paciente por ID:**
   - Ejecuta `Paso 3b - Consultar Paciente por ID` (`GET /pacientes/:id`). Status: **`200 OK`**.
   - Muestra cómo los datos de la Dra. Ana vienen poblados en el campo `medico` sin su contraseña.
6. **Listar pacientes de la Dra. Ana:**
   - Ejecuta `Paso 4 - Listar Pacientes de la Dra. Ana` (`GET /medicos/:id/pacientes`). Status: **`200 OK`**.
7. **Demostración de la regla de negocio (Médico Tratante):**
   - Ejecuta `Paso 5 - Dr. Carlos intenta editar paciente de Dra. Ana` (`PUT /pacientes/:id`).
   - Status observado: **`403 Forbidden`** (`"No tienes permiso para modificar este paciente"`).
   - El paciente queda completamente intacto.
8. **Validación de RUT repetido:**
   - Ejecuta `Paso 6 - Crear Paciente con RUT Duplicado` (`POST /pacientes`).
   - Status observado: **`409 Conflict`** (`"El RUT ya está registrado"`).
