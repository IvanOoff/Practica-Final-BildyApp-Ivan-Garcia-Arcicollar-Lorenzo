# BildyApp API

## Ivan Garcia-Arcicollar Lorenzo

---

API RESTful para la gestión de **albaranes** (partes de horas o materiales) entre clientes y proveedores.

### Tecnologías

- **Node.js 22+** - Runtime con soporte ESM nativo
- **Express 5** - Framework web
- **MongoDB Atlas** + **Mongoose 8** - Base de datos NoSQL
- **JWT** - Autenticación con access tokens y refresh tokens
- **Zod** - Validación de datos
- **Socket.IO** - WebSockets para tiempo real
- **pdfkit** - Generación de PDFs
- **Cloudinary** - Almacenamiento en la nube
- **Nodemailer** - Envío de emails
- **Docker** - Contenedores

---

## Requisitos Previos

- Node.js 22.11.0 o superior
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
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
```

---

## Configuración

Editar `.env` con tus datos reales:

```env
NODE_ENV=development
PORT=3000
DB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/bildyapp
JWT_SECRET=<secret_de_32_caracteres_minimo>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

# Slack (para errores 5XX)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<tu_email@gmail.com>
SMTP_PASS=<app_password>
EMAIL_FROM=noreply@bildyapp.com
```

---

## Ejecución

```bash
# Desarrollo (con --watch)
npm run dev

# Producción
npm start

# Docker
docker compose up -d
```

---

## Endpoints Principales

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/user/register` | Registro |
| PUT | `/api/user/validation` | Validar email |
| POST | `/api/user/login` | Login |
| POST | `/api/user/refresh` | Renovar token |

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
| PATCH | `/api/deliverynote/:id/sign` | Firmar |
| DELETE | `/api/deliverynote/:id` | Eliminar |

### Sistema

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |

---

## Documentación

Swagger disponible en: **http://localhost:3000/api-docs**

---

## Testing

```bash
# Ejecutar tests
npm test

# Con coverage
npm run test:coverage
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

Eventos emitidos a la sala de la compañía:

- `deliverynote:new` - Nuevo albarán creado
- `deliverynote:signed` - Albarán firmado
- `client:new` - Nuevo cliente
- `project:new` - Nuevo proyecto

---

## Estructura del Proyecto

```
bildyapp-api/
├── src/
│   ├── config/          # Configuración
│   ├── controllers/     # Controladores
│   ├── middleware/      # Middlewares
│   ├── models/          # Modelos Mongoose
│   ├── routes/          # Rutas
│   ├── services/        # Servicios (PDF, Storage, Mail, Logger)
│   ├── utils/           # Utilidades
│   ├── validators/      # Schemas Zod
│   ├── app.js           # Express app
│   └── index.js         # Entry point
├── tests/               # Tests Jest
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── requests.http       # Ejemplos REST Client
```

---

## Autor

**Ivan Garcia-Arcicollar Lorenzo**

---

## Licencia

MIT