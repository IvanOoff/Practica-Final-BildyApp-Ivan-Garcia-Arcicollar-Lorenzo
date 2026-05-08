# EXAMEN / WEB
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
// Test 2: hard delete de albarán firmado → 400
// Test 3: sequential numbers únicos con Promise.all (concurrencia)
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

Ambas solicitudes ejecutan el find al mismo tiempo, así que las dos obtienen el mismo resultado: el último albarán creado. Las dos calculan que el siguiente número sería el 4, y las dos intentan insertar `ALB-2026-0004`.

El índice único en `sequentialNumber` hace que MongoDB rechace la segunda inserción con un error E11000 duplicate key error. Si no se gestiona bien en el error handler, esto podría llegar como un 500 al cliente.

---

### 2. `controller:242-260` — `update` rechaza modificar firmado, `delete` no. ¿Consecuencias de borrar firmado con URL en Cloudinary?

Si un albarán firmado se elimina, se pierde la huella legal del documento. En Cloudinary quedan las imágenes de las firmas y los PDFs huérfanos, ocupando espacio sin que nadie pueda acceder a ellos desde la app. El cliente podría negar haber aceptado el servicio, rompiendo el principio de no repudio.

---

### 3. `models/deliveryNote.model.js:115` — Índice unique 11000 → si no se gestiona, llega como 500. Traza desde Mongoose hasta `error-handler.js:46`.

Cuando MongoDB detecta una violación de índice único, devuelve el código 11000. Mongoose lo convierte a MongoServerError. El controller lo pasa al middleware de errores con `next(err)`. Express lo captura y lo envía a errorHandler, que detecta el código 11000 y responde con 409 Conflict.

---

### 4. Hipotético: numeración secuencial multi-réplica. ¿Por qué `findOneAndUpdate` + `$inc` es más robusto?

Porque la operación se ejecuta de forma atómica en el servidor de MongoDB. No hay ventana de tiempo entre buscar y actualizar, así que aunque varias réplicas envíen comandos simultáneamente, MongoDB los serializa correctamente. El upsert crea el contador si no existe sin race conditions.

---

### 5. Contraste: `PATCH /:id/sign` rechaza segunda firma con 400, no 200. ¿Cuál sería correcto según RFC 9110?

400 es la respuesta correcta según RFC 9110. Un documento ya firmado no puede recibir otra firma, así que no es un éxito. Devolver 200 implicaría decir "sí procesé tu solicitud" cuando en realidad no hice nada. 400 comunica claramente que la operación no se pudo completar por estado inválido.

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
| `EXAMEN.md` | Documentación completa | `3d8bfd8` |

---

## Criterios de aceptación verificados

| Criterio | Estado |
|----------|--------|
| `generateSequentialNumber` atómico sin duplicados | ✅ Implementado con `findOneAndUpdate` + `$inc` |
| `delete` rechaza con 400 si `status === 'signed'` | ✅ Implementado línea 249-251 |
| Test borrar firmado → 400 | ✅ Tests en deliverynote.test.js |
| Test concurrencia con `Promise.all` no genera duplicados | ✅ Test de sequential numbers únicos |
| `EXAMEN.md` con respuestas + Proceso | ✅ Documentación completa