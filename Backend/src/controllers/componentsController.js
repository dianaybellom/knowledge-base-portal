const { z } = require('zod');
const components = require('../models/components');
const s3 = require('../services/s3');
const { loadSolution } = require('./solutionsController');
const { HttpError } = require('../middleware/errors');
const { isUuid, requiredText } = require('../utils/validation');

const componentSchema = z.object({
  name: requiredText('El nombre del componente', { max: 120 }),
  version: requiredText('La versión', { max: 30 }),
});

function assertComponentId(id) {
  if (!isUuid(id)) throw new HttpError(404, 'Componente no encontrado.');
}

async function create(req, res) {
  const solution = await loadSolution(req.params.code);
  const data = componentSchema.parse(req.body ?? {});

  let fileKey = null;
  let fileName = null;
  if (req.file) {
    fileName = req.file.originalname.slice(0, 255);
    fileKey = s3.buildComponentKey(solution.id, fileName);
    await s3.uploadFile({
      key: fileKey,
      body: req.file.buffer,
      contentType: req.file.mimetype,
      fileName,
    });
  }

  try {
    const component = await components.create({ solutionId: solution.id, ...data, fileKey, fileName });
    res.status(201).json({ component });
  } catch (err) {
    // Si falla el registro en la base de datos, no se deja el archivo huérfano.
    if (fileKey) await s3.deleteFilesSafely([fileKey]);
    throw err;
  }
}

async function remove(req, res) {
  assertComponentId(req.params.id);
  const { found, fileKey } = await components.remove(req.params.id);
  if (!found) throw new HttpError(404, 'Componente no encontrado.');

  if (fileKey) await s3.deleteFilesSafely([fileKey]);
  res.status(204).end();
}

async function download(req, res) {
  assertComponentId(req.params.id);
  const component = await components.findByIdWithKey(req.params.id);
  if (!component) throw new HttpError(404, 'Componente no encontrado.');
  if (!component.file_key) {
    throw new HttpError(404, 'Este componente todavía no tiene un instalable disponible.');
  }

  const url = await s3.getDownloadUrl(component.file_key);
  res.json({ url, fileName: component.file_name, expiresIn: s3.DOWNLOAD_URL_TTL_SECONDS });
}

module.exports = { create, remove, download };
