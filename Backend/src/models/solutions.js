const db = require('../config/db');
const { DOCUMENT_TYPES } = require('../utils/catalog');

const LIST_COLUMNS = 'id, code, name, type, summary, doc_status, created_at, updated_at';

function toSolutionSummary(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    summary: row.summary,
    docStatus: row.doc_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Escapa los comodines de ILIKE para que el texto buscado se tome literal.
function escapeLike(text) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

async function list({ search, type, docStatus }) {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${escapeLike(search)}%`);
    conditions.push(`(name ILIKE $${params.length} OR summary ILIKE $${params.length})`);
  }
  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }
  if (docStatus) {
    params.push(docStatus);
    conditions.push(`doc_status = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await db.query(
    `SELECT ${LIST_COLUMNS} FROM solutions ${where} ORDER BY name`,
    params
  );
  return rows.map(toSolutionSummary);
}

async function getCoverage() {
  const { rows } = await db.query(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE doc_status = 'complete')::int AS complete,
            count(*) FILTER (WHERE doc_status = 'partial')::int AS partial,
            count(*) FILTER (WHERE doc_status = 'pending')::int AS pending
     FROM solutions`
  );
  const { total, complete, partial, pending } = rows[0];
  const coveragePercent = total === 0 ? 0 : Math.round((complete / total) * 100);
  return { total, complete, partial, pending, coveragePercent };
}

// Soluciones ordenadas por su última novedad: la fecha de su sección Novedades si existe,
// o la fecha general de la solución si no la tiene.
async function listRecentUpdates(limit) {
  const { rows } = await db.query(
    `SELECT s.code, s.name, s.type, s.updated_at, d.content AS release_notes, d.updated_at AS release_notes_updated_at
     FROM solutions s
     LEFT JOIN documents d ON d.solution_id = s.id AND d.type = 'release-notes'
     ORDER BY COALESCE(d.updated_at, s.updated_at) DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

async function findIdByCode(code) {
  const { rows } = await db.query('SELECT id, code, name FROM solutions WHERE code = $1', [code]);
  return rows[0] || null;
}

async function findByCode(code) {
  const { rows } = await db.query(
    `SELECT s.*, u.full_name AS created_by_name
     FROM solutions s
     LEFT JOIN users u ON u.id = s.created_by
     WHERE s.code = $1`,
    [code]
  );
  const row = rows[0];
  if (!row) return null;

  const [members, components, documents] = await Promise.all([
    db.query(
      `SELECT id, name, role FROM solution_members
       WHERE solution_id = $1
       ORDER BY (role = 'po') DESC, position`,
      [row.id]
    ),
    db.query(
      `SELECT id, name, version, file_name, created_at FROM components
       WHERE solution_id = $1 ORDER BY created_at`,
      [row.id]
    ),
    db.query(
      `SELECT type, updated_at FROM documents
       WHERE solution_id = $1
       ORDER BY array_position($2::text[], type)`,
      [row.id, DOCUMENT_TYPES]
    ),
  ]);

  return {
    ...toSolutionSummary(row),
    description: row.description,
    createdBy: row.created_by ? { id: row.created_by, fullName: row.created_by_name } : null,
    members: members.rows,
    components: components.rows.map((component) => ({
      id: component.id,
      name: component.name,
      version: component.version,
      fileName: component.file_name,
      hasFile: component.file_name !== null,
      createdAt: component.created_at,
    })),
    documents: documents.rows.map((document) => ({
      type: document.type,
      updatedAt: document.updated_at,
    })),
  };
}

async function replaceMembers(client, solutionId, members) {
  await client.query('DELETE FROM solution_members WHERE solution_id = $1', [solutionId]);
  for (const [index, member] of members.entries()) {
    await client.query(
      'INSERT INTO solution_members (solution_id, name, role, position) VALUES ($1, $2, $3, $4)',
      [solutionId, member.name, member.role, index]
    );
  }
}

async function withTransaction(work) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function create(data, userId) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO solutions (code, name, type, summary, description, doc_status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [data.code, data.name, data.type, data.summary, data.description, data.docStatus, userId]
    );
    await replaceMembers(client, rows[0].id, data.members);
    return rows[0].id;
  });
}

async function update(code, data) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE solutions
       SET name = $2, type = $3, summary = $4, description = $5, doc_status = $6, updated_at = now()
       WHERE code = $1
       RETURNING id`,
      [code, data.name, data.type, data.summary, data.description, data.docStatus]
    );
    if (rows.length === 0) return false;
    await replaceMembers(client, rows[0].id, data.members);
    return true;
  });
}

// Elimina la solución (las tablas hijas caen en cascada) y devuelve las claves de sus archivos.
async function remove(code) {
  return withTransaction(async (client) => {
    const solution = await client.query('SELECT id FROM solutions WHERE code = $1 FOR UPDATE', [code]);
    if (solution.rows.length === 0) return null;

    const files = await client.query(
      'SELECT file_key FROM components WHERE solution_id = $1 AND file_key IS NOT NULL',
      [solution.rows[0].id]
    );
    await client.query('DELETE FROM solutions WHERE id = $1', [solution.rows[0].id]);
    return files.rows.map((row) => row.file_key);
  });
}

module.exports = {
  list,
  listRecentUpdates,
  getCoverage,
  findIdByCode,
  findByCode,
  create,
  update,
  remove,
};
