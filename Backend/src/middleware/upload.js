const multer = require('multer');

const MAX_FILE_SIZE_MB = 50;

// El archivo queda en memoria y se envía directo al almacenamiento de objetos.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: 1 },
  // Los navegadores envían el nombre del archivo en UTF-8; por defecto multer lo leería como latin1.
  defParamCharset: 'utf8',
});

module.exports = { uploadSingleFile: upload.single('file'), MAX_FILE_SIZE_MB };
