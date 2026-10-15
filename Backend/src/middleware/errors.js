const { ZodError } = require('zod');

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function notFound(req, res) {
  res.status(404).json({ error: 'Recurso no encontrado.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return res.status(400).json({ error: 'Datos no válidos.', details });
  }

  if (err instanceof HttpError) {
    const body = { error: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json(body);
  }

  // Errores de la subida de archivos (multer)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'El archivo supera el tamaño máximo de 50 MB.' });
    }
    return res.status(400).json({
      error: 'La subida no es válida. Envía un solo archivo en el campo "file".',
    });
  }

  // Cuerpo JSON mal formado
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
  }

  // Cuerpo JSON que supera el límite de express.json (1 MB)
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El contenido enviado supera el tamaño máximo de 1 MB.' });
  }

  // Violación de unicidad en PostgreSQL (por ejemplo, email duplicado)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'El registro ya existe.' });
  }

  // Texto con formato inválido para el tipo de la columna (por ejemplo, un UUID mal formado)
  if (err.code === '22P02') {
    return res.status(400).json({ error: 'El identificador no es válido.' });
  }

  console.error('[error]', err);
  return res.status(500).json({ error: 'Error interno del servidor. Intenta de nuevo más tarde.' });
}

module.exports = { HttpError, notFound, errorHandler };
