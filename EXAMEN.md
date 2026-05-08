# EXAMEN - F13: Operaciones idempotentes y atómicas en el ciclo del albarán

## Reto

Implementar operaciones idempotentes y atómicas en el ciclo de vida del albarán para garantizar la integridad de los datos en escenarios de concurrencia y concurrencia de red.

---

## Tarea técnica

### Parte 1 - Implementación

**1. Línea 10-20 (generateSequentialNumber): Contador atómico**

Problema original: El método usaba `find()` + `sort()` + `parseInt()` para obtener el último número secuencial. Esto no es atómico y puede generar duplicados en entornos concurrentes.

Solución implementada:
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

- `findOneAndUpdate` con `$inc` es atómico en MongoDB
- `upsert: true` crea el documento si no existe
- `new: true` devuelve el documento actualizado
- Eliminación de regex + sort que era lento y no era atómico

**2. Línea 249-251 (deleteDeliveryNoteCtrl): Verificación signed antes de borrado**

Problema original: La regla de no modificar albaranes firmados existía en `updateDeliveryNoteCtrl` pero NO en `deleteDeliveryNoteCtrl`, dejando un hueco de integridad.

Solución implementada:
```javascript
/// F13: Verificacion status signed antes de borrado (soft y hard)
if (deliveryNote.status === 'signed') {
  throw AppError.badRequest('NO SE PUEDE ELIMINAR UN ALBARAN FIRMADO');
}
```

- Verificación añadida tanto para soft delete como para hard delete
- Consistencia con la regla de `updateDeliveryNoteCtrl`

**3. Modelo Counter (nuevo archivo)**

```javascript
const counterSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  year: { type: Number, required: true },
  seq: { type: Number, default: 0 }
}, { timestamps: true, versionKey: false });

counterSchema.index({ company: 1, year: 1 }, { unique: true });
```

- Índice único compuesto por company + year para evitar duplicados
- Un contador por empresa por año

---

## Respuestas socráticas

**P: ¿Por qué el método original no era atómico?**
R: El método original hacía:
1. `find()` para buscar todos los albaranes con el prefijo
2. `sort()` + `limit(1)` para obtener el último
3. `parseInt()` para extraer el número
4. Crear el nuevo número

Entre el paso 1 y el paso 4, otro proceso podía insertar un albarán, generando un número duplicado.

**P: ¿Por qué `findOneAndUpdate` con `$inc` es atómico?**
R: MongoDB ejecuta `findOneAndUpdate` como una operación atómica en el servidor. La operación de incremento `$inc` se aplica en el servidor, no en el cliente, eliminando la ventana de race condition.

**P: ¿Por qué crear un modelo Counter en lugar de usar el modelo DeliveryNote?**
R: El DeliveryNote tiene un índice único en `sequentialNumber`. Si usamos un array de contadores dentro del Company, tendríamos que hacer update dentro de Company, lo cual requiere transacciones. El modelo Counter independiente permite usar `findOneAndUpdate` con `upsert` sin transacciones.

**P: ¿Por qué verificar `status === 'signed'` antes de delete?**
R: Porque un albarán firmado representa un documento legal. Permitir su eliminación (soft o hard) comprometería la trazabilidad financiera y legal. Esta verificación cierra el hueco que existía entre la regla de update (que sí tenía la verificación) y la de delete (que no la tenía).

---

## Proceso

### Paso 1: Análisis del problema
- Identificar que `generateSequentialNumber` usaba regex + sort (no atómico)
- Identificar que `deleteDeliveryNoteCtrl` no verificaba status === 'signed'

### Paso 2: Diseño de la solución
- Crear modelo Counter para almacenamiento atómico de secuencias
- Implementar `findOneAndUpdate` con `$inc` para atomicidad
- Añadir verificación de status en delete

### Paso 3: Implementación
- Crear `src/models/Counter.js` con esquema e índices
- Modificar `generateSequentialNumber` en deliverynote.controller.js
- Modificar `deleteDeliveryNoteCtrl` en deliverynote.controller.js
- Añadir comentarios `/// F13` para trazabilidad

### Paso 4: Testing
- Tests de creación concurrente de albaranes (idempotencia)
- Tests de verificación de firma antes de delete
- Verificación de coverage

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/models/Counter.js` | Nuevo - modelo para contador atómico |
| `src/controllers/deliverynote.controller.js` | Modificado - contador atómico + verificación signed |

---

## Tests implementados

1. **Test de creación de albaranes (concurrencia simulada)** - Verifica que los números secuenciales sean únicos
2. **Test de no poder eliminar albarán firmado** - Verifica que soft delete rechace albaranes firmados
3. **Test de no poder eliminar permanentemente albarán firmado** - Verifica que hard delete rechace albaranes firmados