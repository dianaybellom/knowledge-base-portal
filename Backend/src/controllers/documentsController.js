const { z } = require('zod');
const documents = require('../models/documents');
const { loadSolution } = require('./solutionsController');
const { HttpError } = require('../middleware/errors');
const { findEmbedErrors } = require('../utils/embeds');
const { DOCUMENT_TYPES } = require('../utils/catalog');
const { requiredText } = require('../utils/validation');

const documentSchema = z
  .object({ content: requiredText('El contenido', { max: 200000 }) })
  .superRefine((data, ctx) => {
    for (const message of findEmbedErrors(data.content)) {
      ctx.addIssue({ code: 'custom', path: ['content'], message });
    }
  });

function assertDocumentType(type) {
  if (!DOCUMENT_TYPES.includes(type)) {
    throw new HttpError(
      400,
      `El tipo de sección no es válido. Valores permitidos: ${DOCUMENT_TYPES.join(', ')}.`
    );
  }
}

async function getByType(req, res) {
  assertDocumentType(req.params.type);
  const solution = await loadSolution(req.params.code);

  const document = await documents.findByType(solution.id, req.params.type);
  if (!document) throw new HttpError(404, 'Esta sección todavía no tiene contenido.');

  res.json({ document: { ...document, solution: { code: solution.code, name: solution.name } } });
}

async function upsert(req, res) {
  assertDocumentType(req.params.type);
  const solution = await loadSolution(req.params.code);
  const { content } = documentSchema.parse(req.body ?? {});

  const { created, document } = await documents.upsert(solution.id, req.params.type, content);
  res.status(created ? 201 : 200).json({ document });
}

async function remove(req, res) {
  assertDocumentType(req.params.type);
  const solution = await loadSolution(req.params.code);

  const deleted = await documents.remove(solution.id, req.params.type);
  if (!deleted) throw new HttpError(404, 'Esta sección no existe.');
  res.status(204).end();
}

module.exports = { getByType, upsert, remove };
