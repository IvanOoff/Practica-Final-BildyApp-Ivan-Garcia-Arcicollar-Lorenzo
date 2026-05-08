# EXAMEN / WEB 2
## Ivan Garcia-Arcicollar Lorenzo

---

## RETO -> 
Implementar operaciones idempotentes y atómicas en el ciclo de vida del albarán para garantizar la integridad de los datos en escenarios de concurrencia y concurrencia de red.

---

## PARTE 1 - TAREA TÉCNICA

**1. Línea 9-27 del controller: haz `generateSequentialNumber` atómica con `findOneAndUpdate` + `$inc` o colección de contadores.**

```javascript
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

**2. Línea 242-260: añade verificación `status === 'signed'` antes de permitir borrado (soft y hard).**

```javascript
if (deliveryNote.status === 'signed') {
  throw AppError.badRequest('NO SE PUEDE ELIMINAR UN ALBARAN FIRMADO');
}
```

**3. Tests para ambos casos**

```javascript
// Test 1: soft delete de albarán firmado → 400
it('should reject soft delete of signed delivery note', async () => {
  const newDN = await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...testDeliveryNote, project: projectId })
    .expect(201);

  const dnId = newDN.body.data._id;

  await request(app)
    .patch(`/api/deliverynote/${dnId}/sign`)
    .set('Authorization', `Bearer ${token}`)
    .send({ signedBy: 'Test Signer' })
    .expect(200);

  const res = await request(app)
    .delete(`/api/deliverynote/${dnId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(400);

  expect(res.body.error).toBe(true);
  expect(res.body.message).toContain('FIRMADO');
});

// Test 2: hard delete de albarán firmado → 400
it('should reject hard delete of signed delivery note', async () => {
  const newDN = await request(app)
    .post('/api/deliverynote')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...testDeliveryNote, project: projectId })
    .expect(201);

  const dnId = newDN.body.data._id;

  await request(app)
    .patch(`/api/deliverynote/${dnId}/sign`)
    .set('Authorization', `Bearer ${token}`)
    .send({ signedBy: 'Test Signer' })
    .expect(200);

  const res = await request(app)
    .delete(`/api/deliverynote/${dnId}?permanent=true`)
    .set('Authorization', `Bearer ${token}`)
    .expect(400);

  expect(res.body.error).toBe(true);
  expect(res.body.message).toContain('FIRMADO');
});

// Test 3: sequential numbers únicos con Promise.all (concurrencia)
it('should generate unique sequential numbers', async () => {
  const [dn1, dn2] = await Promise.all([
    request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...testDeliveryNote, project: projectId })
      .expect(201),
    request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...testDeliveryNote, project: projectId })
      .expect(201)
  ]);

  expect(dn1.body.data.sequentialNumber).not.toBe(dn2.body.data.sequentialNumber);
});
```

**Archivos y líneas modificadas:**

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `src/controllers/deliverynote.controller.js` | 2 | Importa Counter |
| `src/controllers/deliverynote.controller.js` | 10-19 | `generateSequentialNumber` atómico con `findOneAndUpdate` + `$inc` |
| `src/controllers/deliverynote.controller.js` | 249-251 | Verificación `status === 'signed'` antes de delete |
| `src/models/Counter.js` | 1-25 | Nuevo modelo Counter con índice único |

---

## PARTE 2 - RESPUESTAS SOCRÁTICAS

### 1. `controller:9-27` — Dos POST simultáneos: ¿qué devuelve `find().sort().limit(1)`? ¿Qué error lanza Mongoose con índice único?

**Código original vulnerable (líneas 13-16):**
```javascript
const lastNote = await DeliveryNote.find({
  company: companyId,
  sequentialNumber: { $regex: `^${prefix}` }
}).sort({ sequentialNumber: -1 }).limit(1);
```

**¿Qué devuelve `find().sort().limit(1)`?**

Ambas solicitudes leen el mismo documento: el último creado (ej: `ALB-2026-0003`). Ambas calculan `nextNumber = 4`. Ambas intentan insertar `ALB-2026-0004`.

**¿Qué error lanza Mongoose con índice único?**

`MongoServerError: E11000 duplicate key error collection: bildyapp.deliverynotes index: sequentialNumber_1 dup key: { sequentialNumber: "ALB-2026-0004" }`.

El índice único en `deliveryNoteSchema.index({ sequentialNumber: 1 }, { unique: true })` causa que MongoDB rechace el segundo insert.

---

### 2. `controller:242-260` — `update` rechaza modificar firmado, `delete` no. ¿Consecuencias de borrar firmado con URL en Cloudinary?

**Código vulnerable (antes - delete no verificaba):**
```javascript
// deliverynote.controller.js línea 254-259 (ANTES)
deliveryNote.deleted = true;
deliveryNote.deletedAt = new Date();
await deliveryNote.save();
```

**Código corregido (línea 249-252 - AHORA verifica):**
```javascript
/// F13: Verificacion status signed antes de borrado (soft y hard)
if (deliveryNote.status === 'signed') {
  throw AppError.badRequest('NO SE PUEDE ELIMINAR UN ALBARAN FIRMADO');
}
```

**Consecuencias de borrar firmado con URL en Cloudinary:**

- **Huella legal desaparecida:** El albarán firmado tiene valor legal. Si se elimina, no hay forma de demostrar que el servicio fue prestado y aceptado.

- **Orphan assets en Cloudinary:** Las imágenes de firmas y PDFs siguen existiendo en Cloudinary aunque el registro en BD desaparezca.

- **Violación del principio de no repudio:** El cliente puede negar haber recibido o aceptado el servicio.

- **Inconsistencia de datos:** Un auditor no encontrará el albarán en BD pero los archivos en Cloudinary siguen ahí.

---

### 3. `models/deliveryNote.model.js:115` — Índice unique 11000 → si no se gestiona, llega como 500. Traza desde Mongoose hasta `error-handler.js:46`.

1. `DeliveryNote.create()` intenta insertar con `sequentialNumber` duplicado
2. MongoDB detecta violación de índice único y devuelve código `11000`
3. Mongoose convierte el error a `MongoServerError`
4. Controller pasa el error a `next(err)`
5. Express captura y pasa al middleware `errorHandler`
6. `errorHandler.js:46` detecta `error.code === 11000` y responde con **409 Conflict** (no 500)

---

### 4. Hipotético: numeración secuencial multi-réplica. ¿Por qué `findOneAndUpdate` + `$inc` es más robusto?

**Código que evita el problema (línea 13-17):**
```javascript
const counter = await Counter.findOneAndUpdate(
  { company: companyId, year },
  { $inc: { seq: 1 } },
  { new: true, upsert: true }
);
```

- **Atomicidad en el servidor:** `findOneAndUpdate` con `$inc` se ejecuta atómicamente en MongoDB. No hay ventana entre búsqueda y actualización.

- **Sin transacciones distribuidas:** El `$inc` se ejecuta en el servidor, no en el cliente. Las múltiples réplicas serializan correctamente.

- **Upsert automático:** Si el counter no existe para company+year, lo crea sin race condition.

- **Orden determinista:** Aunque las réplicas envíen comandos concurrently, el resultado es una secuencia consecutina sin duplicados.

---

### 5. Contraste: `PATCH /:id/sign` rechaza segunda firma con 400, no 200. ¿Cuál sería correcto según RFC 9110?

**Código que implementa esto (línea 185-187 del controller):**
```javascript
if (deliveryNote.status === 'signed') {
  throw AppError.badRequest('YA ESTA FIRMADO');
}
```

**400 es correcto según RFC 9110.**

- 200 OK: La solicitud se ejecutó con éxito y el estado cambió
- 400 Bad Request: La solicitud no puede procesarse por razones semánticas

Firmar un documento ya firmado no es un éxito (el estado no cambia), es un error semántico. Devolver 200 implicaría "sí procesé tu solicitud" cuando no hice nada.

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
