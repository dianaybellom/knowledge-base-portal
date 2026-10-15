const db = require('../config/db');

function toComponent(row) {
  return {
    id: row.id,
    solutionId: row.solution_id,
    name: row.name,
    version: row.version,
    fileName: row.file_name,
    hasFile: row.file_name !== null,
    createdAt: row.created_at,
  };
}

async function create({ solutionId, name, version, fileKey, fileName }) {
  const { rows } = await db.query(
    `INSERT INTO components (solution_id, name, version, file_key, file_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [solutionId, name, version, fileKey, fileName]
  );
  await db.query('UPDATE solutions SET updated_at = now() WHERE id = $1', [solutionId]);
  return toComponent(rows[0]);
}

// Incluye file_key: uso interno, nunca se envía al cliente.
async function findByIdWithKey(id) {
  const { rows } = await db.query('SELECT * FROM components WHERE id = $1', [id]);
  return rows[0] || null;
}

async function remove(id) {
  const { rows } = await db.query('DELETE FROM components WHERE id = $1 RETURNING file_key', [id]);
  if (rows.length === 0) return { found: false, fileKey: null };
  return { found: true, fileKey: rows[0].file_key };
}

module.exports = { create, findByIdWithKey, remove };
