const { z } = require('zod');
const solutions = require('../models/solutions');
const s3 = require('../services/s3');
const { HttpError } = require('../middleware/errors');
const { findEmbedErrors } = require('../utils/embeds');
const { extractLatestRelease } = require('../utils/releaseNotes');
const { SOLUTION_TYPES, DOC_STATUSES, MEMBER_ROLES, CODE_PATTERN } = require('../utils/catalog');
const { enumField, requiredText, optionalQuery } = require('../utils/validation');

const listQuerySchema = z.object({
  search: optionalQuery(z.string().trim().max(100, 'La búsqueda no puede superar 100 caracteres.')),
  type: optionalQuery(enumField(SOLUTION_TYPES, 'El tipo')),
  docStatus: optionalQuery(enumField(DOC_STATUSES, 'El estado documental')),
});

const memberSchema = z.object({
  name: requiredText('El nombre del responsable', { max: 120 }),
  role: enumField(MEMBER_ROLES, 'El rol del responsable'),
});

const solutionFields = {
  name: requiredText('El nombre', { min: 2, max: 120 }),
  type: enumField(SOLUTION_TYPES, 'El tipo'),
  summary: requiredText('El resumen', { max: 300 }),
  description: requiredText('La descripción', { max: 20000 }),
  docStatus: enumField(DOC_STATUSES, 'El estado documental').default('pending'),
  members: z
    .array(memberSchema, { invalid_type_error: 'Los responsables deben enviarse como una lista.' })
    .max(20, 'No puede haber más de 20 responsables.')
    .default([]),
};

function refineSolution(data, ctx) {
  if (data.members.filter((member) => member.role === 'po').length > 1) {
    ctx.addIssue({ code: 'custom', path: ['members'], message: 'Solo puede haber un PO por solución.' });
  }
  for (const message of findEmbedErrors(data.description)) {
    ctx.addIssue({ code: 'custom', path: ['description'], message });
  }
}

const createSchema = z
  .object({
    code: z
      .string({ required_error: 'El código es obligatorio.' })
      .trim()
      .min(1, 'El código es obligatorio.')
      .max(80, 'El código no puede superar 80 caracteres.')
      .regex(
        CODE_PATTERN,
        'El código solo admite minúsculas, números y guiones simples (ejemplo: accessibility-assistant).'
      ),
    ...solutionFields,
  })
  .superRefine(refineSolution);

const updateSchema = z.object(solutionFields).superRefine(refineSolution);

function notFound() {
  return new HttpError(404, 'Solución no encontrada.');
}

// Carga una solución por su code o responde 404.
async function loadSolution(code) {
  if (!CODE_PATTERN.test(code)) throw notFound();
  const solution = await solutions.findIdByCode(code);
  if (!solution) throw notFound();
  return solution;
}

async function list(req, res) {
  const filters = listQuerySchema.parse(req.query);
  res.json({ solutions: await solutions.list(filters) });
}

async function coverage(req, res) {
  res.json(await solutions.getCoverage());
}

const recentUpdatesQuerySchema = z.object({
  limit: optionalQuery(
    z.coerce
      .number({ invalid_type_error: 'El límite debe ser un número.' })
      .int('El límite debe ser un número entero.')
      .min(1, 'El límite mínimo es 1.')
      .max(20, 'El límite máximo es 20.')
  ),
});

async function recentUpdates(req, res) {
  const { limit = 5 } = recentUpdatesQuerySchema.parse(req.query);
  const rows = await solutions.listRecentUpdates(limit);

  const updates = rows.map((row) => {
    const solution = { code: row.code, name: row.name, type: row.type };
    if (row.release_notes === null) {
      return { solution, source: 'solution', title: 'Solución actualizada', excerpt: null, publishedAt: row.updated_at };
    }
    const { title, excerpt } = extractLatestRelease(row.release_notes);
    return {
      solution,
      source: 'release-notes',
      title: title || 'Novedades actualizadas',
      excerpt: excerpt || null,
      publishedAt: row.release_notes_updated_at,
    };
  });

  res.json({ updates });
}

async function getByCode(req, res) {
  if (!CODE_PATTERN.test(req.params.code)) throw notFound();
  const solution = await solutions.findByCode(req.params.code);
  if (!solution) throw notFound();
  res.json({ solution });
}

async function create(req, res) {
  const data = createSchema.parse(req.body ?? {});
  try {
    await solutions.create(data, req.user.id);
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'solutions_code_key') {
      throw new HttpError(409, `Ya existe una solución con el código "${data.code}".`);
    }
    throw err;
  }
  res.status(201).json({ solution: await solutions.findByCode(data.code) });
}

async function update(req, res) {
  const body = req.body ?? {};
  if (body.code !== undefined && body.code !== req.params.code) {
    throw new HttpError(400, 'El código de una solución no se puede modificar.');
  }
  await loadSolution(req.params.code);

  const data = updateSchema.parse(body);
  const updated = await solutions.update(req.params.code, data);
  if (!updated) throw notFound();
  res.json({ solution: await solutions.findByCode(req.params.code) });
}

async function remove(req, res) {
  if (!CODE_PATTERN.test(req.params.code)) throw notFound();
  const fileKeys = await solutions.remove(req.params.code);
  if (fileKeys === null) throw notFound();

  // Si el almacenamiento falla, el error queda en el log y la eliminación sigue siendo válida.
  await s3.deleteFilesSafely(fileKeys);
  res.status(204).end();
}

module.exports = { list, coverage, recentUpdates, getByCode, create, update, remove, loadSolution };
