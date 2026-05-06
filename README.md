# BildyApp API

## Ivan Garcia-Arcicollar Lorenzo

---

API RESTful para la gestión de **albaranes** (partes de horas o materiales) entre clientes y proveedores.

### Tecnologías

- **Node.js 22+** - Runtime con soporte ESM nativo
- **Express 5** - Framework web
- **MongoDB** + **Mongoose 9** - Base de datos NoSQL
- **JWT** - Autenticación con access tokens y refresh tokens
- **Zod** - Validación de datos
- **Socket.IO** - WebSockets para tiempo real
- **pdfkit** - Generación de PDFs
- **Cloudinary** - Almacenamiento en la nube (firmas, logos)
- **Sharp** - Optimización de imágenes
- **Nodemailer** - Envío de emails (verificación, notificaciones)
- **Docker** - Contenedores

---

## Requisitos Previos

- Node.js 22.11.0 o superior
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) (o MongoDB local)
- Docker y Docker Compose (opcional)
- Git

---

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/IvanOoff/Practica-Final-BildyApp-Ivan-Garcia-Arcicollar-Lorenzo.git
cd bildyapp-api

# Instalar dependencias
npm install

# Crear archivo .env desde el ejemplo
cp .env.example .env

# Editar .env con tus datos reales
```

---

## Configuración

Editar `.env` con tus datos reales:

```env
NODE_ENV=development
PORT=3000
DB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/bildyapp
JWT_SECRET=<secret_de_32_caracteres_minimo>
REFRESH_TOKEN_SECRET=<secret_refresh>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

# Slack (para errores 5XX)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz

# Email (Gmail, SendGrid, Mailtrap, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<tu_email@gmail.com>
SMTP_PASS=<app_password>
EMAIL_FROM=noreply@bildyapp.com
```

---

## Ejecución

```bash
# Desarrollo (con --watch para recargar cambios)
npm run dev

# Producción
npm start

# Docker (incluye MongoDB)
docker compose up -d
```

---

## Endpoints Principales

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/user/register` | Registro de usuario |
| PUT | `/api/user/validation` | Validar email con código |
| POST | `/api/user/login` | Login (devuelve tokens) |
| POST | `/api/user/refresh` | Renovar access token |
| POST | `/api/user/logout` | Cerrar sesión |
| GET | `/api/user` | Obtener usuario autenticado |
| PUT | `/api/user/register` | Actualizar perfil |
| PUT | `/api/user/password` | Cambiar contraseña |
| DELETE | `/api/user` | Eliminar cuenta |

### Gestión de Empresa

| Método | Ruta | Descripción |
|--------|------|-------------|
| PATCH | `/api/user/company` | Crear empresa |
| PATCH | `/api/user/company/join` | Unirse a empresa existente |
| GET | `/api/user/company` | Ver empresa |
| PUT | `/api/user/company` | Actualizar empresa |
| PATCH | `/api/user/logo` | Subir logo |
| POST | `/api/user/invite` | Invitar usuario |

### Clientes

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/client` | Crear cliente |
| GET | `/api/client` | Listar (paginación, filtros) |
| GET | `/api/client/:id` | Obtener uno |
| PUT | `/api/client/:id` | Actualizar |
| DELETE | `/api/client/:id` | Eliminar (soft/hard) |
| GET | `/api/client/archived` | Listar archivados |
| PATCH | `/api/client/:id/restore` | Restaurar |

### Proyectos

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/project` | Crear proyecto |
| GET | `/api/project` | Listar (paginación, filtros) |
| GET | `/api/project/:id` | Obtener uno |
| PUT | `/api/project/:id` | Actualizar |
| PATCH | `/api/project/:id/status` | Cambiar estado |
| DELETE | `/api/project/:id` | Eliminar (soft/hard) |
| GET | `/api/project/archived` | Listar archivados |
| PATCH | `/api/project/:id/restore` | Restaurar |

### Albaranes

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/deliverynote` | Crear albarán |
| GET | `/api/deliverynote` | Listar (paginación, filtros) |
| GET | `/api/deliverynote/:id` | Obtener uno |
| GET | `/api/deliverynote/pdf/:id` | Descargar PDF |
| PATCH | `/api/deliverynote/:id/send` | Enviar albarán |
| PATCH | `/api/deliverynote/:id/sign` | Firmar albarán |
| DELETE | `/api/deliverynote/:id` | Eliminar (solo si no está firmado) |

### Sistema

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check (estado del servidor, DB, uptime) |

---

## Documentación

Swagger disponible en: **http://localhost:3000/api-docs**

Incluye todos los endpoints documentados con OpenAPI 3.0.

---

## Testing

```bash
# Ejecutar tests
npm test

# Tests con watch (desarrollo)
npm run test:watch
```

---

## Docker

```bash
# Construir imagen
docker build -t bildyapp-api .

# Ejecutar con docker-compose (incluye MongoDB)
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

---

## Eventos en Tiempo Real (Socket.IO)

Socket.IO conecta automáticamente a los usuarios en rooms por company.

Eventos emitidos:

- `deliverynote:new` - Nuevo albarán creado
- `deliverynote:signed` - Albarán firmado
- `client:new` - Nuevo cliente creado
- `project:new` - Nuevo proyecto creado

---

## Estructura del Proyecto

```
bildyapp-api/
├── src/
│   ├── config/
│   │   ├── index.js            # Configuración centralizada
│   │   ├── database.js         # Conexión a MongoDB
│   │   ├── swagger.js          # Configuración Swagger/OpenAPI
│   │   └── socket.js           # Configuración Socket.IO
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── client.controller.js
│   │   ├── project.controller.js
│   │   └── deliverynote.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # Verificación JWT
│   │   ├── error-handler.js    # Middleware centralizado de errores
│   │   ├── rate-limit.js       # Rate limiting
│   │   ├── sanitize.js         # Sanitización NoSQL
│   │   ├── upload.js           # Configuración de Multer
│   │   ├── validate.js         # Middleware de validación Zod
│   │   ├── socket-auth.middleware.js  # Auth para Socket.IO
│   │   └── role.middleware.js   # Control de roles
│   ├── models/
│   │   ├── User.js
│   │   ├── Company.js
│   │   ├── Client.js
│   │   ├── Project.js
│   │   ├── DeliveryNote.js
│   │   └── RefreshToken.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── user.routes.js
│   │   ├── client.routes.js
│   │   ├── project.routes.js
│   │   └── deliverynote.routes.js
│   ├── services/
│   │   ├── logger.service.js   # Logger con Slack (errores 5XX)
│   │   ├── mail.service.js     # Envío de emails
│   │   ├── pdf.service.js      # Generación de PDFs
│   │   ├── storage.service.js  # Subida a Cloudinary/R2/S3
│   │   └── notification.service.js  # Eventos de usuario
│   ├── handlers/
│   │   └── socket.handler.js   # Handlers de Socket.IO
│   ├── utils/
│   │   ├── AppError.js         # Clase para errores controlados
│   │   ├── handlePassword.js   # Encriptación de passwords
│   │   └── handleJwt.js        # Manejo de JWT tokens
│   ├── validators/
│   │   ├── user.validator.js
│   │   ├── client.validator.js
│   │   ├── project.validator.js
│   │   └── deliverynote.validator.js
│   ├── app.js                  # Configuración de Express
│   └── index.js                # Punto de entrada
├── tests/
│   ├── setup.js                # Configuración de mongodb-memory-server
│   ├── auth.test.js
│   ├── client.test.js
│   ├── project.test.js
│   ├── deliverynote.test.js
│   ├── middleware.test.js
│   ├── validators.test.js
│   ├── services.test.js
│   └── services.mock.test.js
├── .github/
│   └── workflows/
│       └── test.yml            # GitHub Actions CI/CD
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── jest.config.js
├── package.json
└── README.md
```

---

## Seguridad

- **Helmet** - Headers de seguridad HTTP
- **Rate Limiting** - 100 requests / 15 minutos
- **Sanitización NoSQL** - Previene inyecciones MongoDB
- **Validación Zod** - Todos los inputs validados
- **JWT con refresh tokens** - Autenticación segura
- **Passwords encriptados** - bcryptjs

---

## Autor

**Ivan Garcia-Arcicollar Lorenzo**

---

## Licencia

MIT