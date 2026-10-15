const { z } = require('zod');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

// Enum con un mensaje de error en español que lista los valores permitidos.
function enumField(values, fieldLabel) {
  return z.enum(values, {
    errorMap: () => ({ message: `${fieldLabel} no es válido. Valores permitidos: ${values.join(', ')}.` }),
  });
}

// Texto obligatorio, recortado, con límites de longitud.
function requiredText(fieldLabel, { min = 1, max }) {
  return z
    .string({
      required_error: `${fieldLabel} es obligatorio.`,
      invalid_type_error: `${fieldLabel} debe ser texto.`,
    })
    .trim()
    .min(min, min === 1 ? `${fieldLabel} es obligatorio.` : `${fieldLabel} debe tener al menos ${min} caracteres.`)
    .max(max, `${fieldLabel} no puede superar ${max.toLocaleString('es')} caracteres.`);
}

// Convierte "" en undefined (útil para filtros de query string vacíos).
function optionalQuery(schema) {
  return z.preprocess((value) => (value === '' ? undefined : value), schema.optional());
}

module.exports = { isUuid, enumField, requiredText, optionalQuery };
