# EXAMEN - F13: Operaciones idempotentes y atómicas en el ciclo del albarán

## Ivan Garcia-Arcicollar Lorenzo

---

## Reto

Implementar operaciones idempotentes y atómicas en el ciclo de vida del albarán para garantizar la integridad de los datos en escenarios de concurrencia y concurrencia de red.

---

## Tarea técnica (Parte 1)

### Implementación realizada

**1. Contador atómico `generateSequentialNumber` (línea 10-20)**

Problema original: El método usaba `find()` + `sort()` + `parseInt()` para obtener el último número secuencial. Esto no es atómico y puede generar duplicados en entornos concurrentes.

```javascript
/// F13: Contador atomico con findOneAndUpdate + $inc (reemplaza regex + sort)
const generateSequentialNumber = async (companyId) => {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { company: companyId, year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `ALB-${year}-${counter.seq.toString().padStart(4, '0')}`;
};
```

**2. Verificación `status === 'signed'` antes de borrado (línea 249-251)**

Problema original: La regla de no modificar albaranes firmados existía en `updateDeliveryNoteCtrl` pero NO en `deleteDeliveryNoteCtrl`, dejando un hueco de integridad.

```javascript
/// F13: Verificacion status signed antes de borrado (soft y hard)
if (deliveryNote.status === 'signed') {
  throw AppError.badRequest('NO SE PUEDE ELIMINAR UN ALBARAN FIRMADO');
}
```

**3. Modelo Counter (nuevo archivo)**

```javascript
const counterSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  year: { type: Number, required: true },
  seq: { type: Number, default: 0 }
}, { timestamps: true, versionKey: false });

counterSchema.index({ company: 1, year: 1 }, { unique: true });
```

---

## Respuestas socráticas (Parte 2)

### Pregunta 1: Dos POST simultáneos con método original

**Escenario:** Dos POST `/api/deliverynote` ejecutándose concurrently con el código original:

```javascript
// Código original (NO atómico)
const lastNote = await DeliveryNote.find({
  company: companyId,
  sequentialNumber: { $regex: `^${prefix}` }
}).sort({ sequentialNumber: -1 }).limit(1);

let nextNumber = 1;
if (lastNote.length > 0) {
  const lastNum = parseInt(lastNote[0].sequentialNumber.split('-')[2]);
  nextNumber = lastNum + 1;
}
return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
```

**¿Qué devuelve `find().sort().limit(1)`?**

Ambas solicitudes leen el mismo documento (el último creado, ej: `ALB-2026-0003`), calculan `nextNumber = 4`, y ambas intentan insertar `ALB-2026-0004`.

**¿Qué error lanza Mongoose con índice único?**

El índice único en `deliveryNoteSchema.index({ sequentialNumber: 1 }, { unique: true })` causa un error `MongoServerError: E11000 duplicate key error collection: bildyapp.deliverynotes index: sequentialNumber_1 dup key: { sequentialNumber: "ALB-2026-0004" }`.

Este error llega al `errorHandler.js` línea 46, que detecta `error.code === 11000` y responde con 409 Conflict.

**Conclusión:** El método original no solo genera números duplicados, sino que causa un error 500 si no se maneja correctamente (aunque el handler lo convierte a 409, sigue siendo un fallo de negocio).

---

### Pregunta 2: Consecuencias de borrar firmado con URL en Cloudinary

**Situación:** Se elimina un albarán firmado (soft o hard delete) que tiene `signatureUrl` o `pdfUrl` apuntando a Cloudinary.

**Problemas:**

1. **Huella legal desaparecida:** El albarán firmado representa un documento legal. Si un cliente disputa el servicio, no hay forma de demostrar que existía una firma válida.

2. ** orphan assets en Cloudinary:** Los archivos en Cloudinary (firmas, PDFs) siguen existiendo aunque el registro en BD se eliminó. Nadie puede acceder a ellos desde la app, pero siguen ocupando espacio y costando dinero.

3. **Inconsistencia de datos:** Un auditor que busque `ALB-2026-0001` no lo encontrará en la BD porque fue "eliminado", pero el PDF seguía accesible en Cloudinary (si alguien tenía el URL directo) o simplemente desapareció sin dejar rastro.

4. **Violación del principio de no repudio:** En muchos países, un albarán firmado tiene valor legal. Eliminarlo invalida la capacidad de demostrar que el servicio fue prestado y aceptado.

**Código vulnerable (antes):**
```javascript
// Soft delete - NO verificaba signed
deliveryNote.deleted = true;
deliveryNote.deletedAt = new Date();
await deliveryNote.save();
```

**Código corregido:**
```javascript
// Ahora sí verifica
if (deliveryNote.status === 'signed') {
  throw AppError.badRequest('NO SE PUEDE ELIMINAR UN ALBARAN FIRMADO');
}
```

---

### Pregunta 3: Traza error 11000 desde Mongoose hasta error-handler.js

**Índice único:** `deliveryNoteSchema.index({ sequentialNumber: 1 }, { unique: true });` (línea 162 del modelo)

**Traza completa:**

1. **Mongoose intenta insertar documento duplicado:**
   - `await DeliveryNote.create({ sequentialNumber: 'ALB-2026-0004' })`
   - MongoDB detecta violación de índice único

2. **MongoDB devuelve error con código 11000:**
   ```javascript
   {
     "ok": 0,
     "errmsg": "E11000 duplicate key error collection: bildyapp.deliverynotes index: sequentialNumber_1 dup key: { sequentialNumber: \"ALB-2026-0004\" }",
     "code": 11000
   }
   ```

3. **Mongoose convierte a MongooseError:**
   - El driver nativo convierte el error de MongoDB
   - Se crea un error con estructura `MongoServerError`

4. **Error llega a controller (línea 52-74 de deliverynote.controller.js):**
   ```javascript
   } catch (err) {
     next(err);  // Pasa el error al middleware
   }
   ```

5. **Express pasa error al middleware de error (error-handler.js:46):**
   ```javascript
   if (error.code === 11000) {
     const field = Object.keys(error.keyValue)[0];
     return res.status(409).json({
       error: true,
       code: 'DUPLICATE_KEY',
       message: `${field} duplicado`
     });
   }
   ```

**Resultado:** El cliente recibe 409 con `{ error: true, code: 'DUPLICATE_KEY', message: 'sequentialNumber duplicado' }`.

---

### Pregunta 4: `findOneAndUpdate` + `$inc` multi-réplica

**Escenario hipotético:** Tres instancias de la API corriendo en diferentes servidores (réplicas), todas escribiendo a la misma colección `counters`.

**Problema con soluciones alternativas:**

| Solución | Problema en multi-réplica |
|----------|---------------------------|
| `find()` + `sort()` + `insert()` | Race condition: dos réplicas leen el mismo número y ambas insertan |
| Secuencia SQL (auto_increment) | Requiere transacción distribuida para garantizar atomicidad |
| Redis INCR | Dependencia externa, punto único de fallo |

**Por qué `findOneAndUpdate` + `$inc` es robusto:**

```javascript
await Counter.findOneAndUpdate(
  { company: companyId, year },
  { $inc: { seq: 1 } },
  { new: true, upsert: true }
);
```

1. **Atomicidad a nivel de documento:** MongoDB ejecuta `findOneAndUpdate` como operación atómica indivisible. No hay ventana de tiempo entre la búsqueda y la actualización.

2. **Sin transacción distribuidos:** El `$inc` se ejecuta en el servidor MongoDB, no en el cliente. Las tres réplicas envían la misma operación, y MongoDB las serializa correctamente.

3. **Optimistic locking implícito:** Si dos operaciones compiten por el mismo documento, MongoDB aplica primero una y luego la segunda con el valor ya incrementado. No hay conflicto, solo orden determinista.

4. **Upsert resuelve creación inicial:** Si el counter no existe para esa company+year, `upsert: true` lo crea automáticamente. No hay race condition en la creación inicial.

5. **Orden total garantizado:** Cada incremento es sucesivo (1, 2, 3...). Aunque las réplicas enviaran comandos concurrently, el resultado final es una secuencia consecutiva sin huecos ni duplicados.

---

### Pregunta 5: `PATCH /:id/sign` segunda firma - ¿400 o 200?

**Código actual:**
```javascript
if (deliveryNote.status === 'signed') {
  throw AppError.badRequest('YA ESTA FIRMADO');
}
```

**RFC 9110 (HTTP Semantics) - Idempotencia:**

- **200 OK:** La solicitud se ejecutó con éxito y no hay estado que cambiar (el recurso ya está en el estado solicitado).
- **400 Bad Request:** La solicitud no puede ser procesada por razones sintácticas o semánticas.

**Análisis:**

| Escenario | Respuesta correcta | Justificación |
|-----------|-------------------|----------------|
| Firma sobre no-firmado | 200 + firma el documento | Éxito, estado cambió |
| Firma sobre ya-firmado | 400 | Error semántico: el documento ya tiene firma |

**Conclusión:** La respuesta **400 es correcta** según RFC 9110.

**Justificación técnica:**
- Un albarán firmado no puede recibir otra firma (sería doble facturación)
- Devolver 200 implicaría "sí, procesé tu solicitud", cuando en realidad no hice nada
- 400 comunica claramente que la operación no pudo completarse por estado inválido

**Analogía:** POST a `/api/deliverynote` con datos inválidos devuelve 400, no 200. Firme un documento ya firmado es un "dato inválido" para la operación de firma.

---

## Proceso

### Fase 1: Análisis del problema

1. Identificar que `generateSequentialNumber` usaba regex + sort (no atómico)
   - Problema: Entre `find()` y `create()`, otra solicitud podía insertar
   - Consecuencia: Posible E11000 duplicate key error

2. Identificar que `deleteDeliveryNoteCtrl` no verificaba `status === 'signed'`
   - Problema: Inconsistencia con `updateDeliveryNoteCtrl` que sí verificaba
   - Consecuencia: Albarán firmado podía eliminarse, rompiendo trazabilidad legal

### Fase 2: Diseño de la solución

1. **Counter model:**
   - Nuevo modelo independiente para almacenar secuencias
   - Índice único compuesto (company + year) para evitar duplicados
   - Campo `seq` tipo Number para incremento atómico

2. **generateSequentialNumber atómico:**
   - `findOneAndUpdate` con `$inc: { seq: 1 }`
   - `upsert: true` para crear si no existe
   - `new: true` para retornar el documento actualizado

3. **Verificación en delete:**
   - Check `status === 'signed'` antes de soft delete
   - Check `status === 'signed'` antes de hard delete
   - Mensaje claro: "NO SE PUEDE ELIMINAR UN ALBARAN FIRMADO"

### Fase 3: Implementación

1. Crear `src/models/Counter.js` con esquema e índices
2. Importar Counter en `deliverynote.controller.js`
3. Reemplazar lógica de `generateSequentialNumber`
4. Añadir verificación en `deleteDeliveryNoteCtrl`
5. Añadir comentarios `/// F13` para trazabilidad

### Fase 4: Testing

1. Test: soft delete de albarán firmado → 400
2. Test: hard delete de albarán firmado → 400
3. Test: sequential numbers únicos con `Promise.all` (simula concurrencia)

---

## Archivos modificados

| Archivo | Cambio | Commit |
|---------|--------|--------|
| `src/models/Counter.js` | Nuevo - modelo para contador atómico | `e627752` |
| `src/controllers/deliverynote.controller.js` | Modificado - contador atómico + verificación signed | `f0075c5` |
| `tests/deliverynote.test.js` | Nuevos tests F13 | `3376340` |
| `EXAMEN.md` | Documentación completa | `4b1bfd9` |

---

## Criterios de aceptación verificados

| Criterio | Estado |
|----------|--------|
| `generateSequentialNumber` atómico sin duplicados | ✅ Implementado con `findOneAndUpdate` + `$inc` |
| `delete` rechaza con 400 si `status === 'signed'` | ✅ Implementado línea 249-251 |
| Test borrar firmado → 400 | ✅ Tests en deliverynote.test.js |
| Test concurrencia con `Promise.all` no genera duplicados | ✅ Test de sequential numbers únicos |
| `EXAMEN.md` con respuestas + Proceso | ✅ Documentación completa |