const db = require('../config/db');

async function findByType(solutionId, type) {
  const { rows } = await db.query(
    'SELECT type, content, updated_at FROM documents WHERE solution_id = $1 AND type = $2',
    [solutionId, type]
  );
  const row = rows[0];
  if (!row) return null;
  return { type: row.type, content: row.content, updatedAt: row.updated_at };
}

// Crea la sección o reemplaza su contenido; también marca la solución como actualizada.
async function upsert(solutionId, type, content) {
  const { rows } = await db.query(
    `WITH saved AS (
       INSERT INTO documents (solution_id, type, content)
       VALUES ($1, $2, $3)
       ON CONFLICT (solution_id, type)
       DO UPDATE SET content = EXCLUDED.content, updated_at = now()
       RETURNING type, content, updated_at, (xmax = 0) AS inserted
     ), touched AS (
       UPDATE solutions SET updated_at = now() WHERE id = $1
     )
     SELECT * FROM saved`,
    [solutionId, type, content]
  );
  const row = rows[0];
  return {
    created: row.inserted,
    document: { type: row.type, content: row.content, updatedAt: row.updated_at },
  };
}

async function remove(solutionId, type) {
  const { rowCount } = await db.query(
    'DELETE FROM documents WHERE solution_id = $1 AND type = $2',
    [solutionId, type]
  );
  if (rowCount > 0) {
    await db.query('UPDATE solutions SET updated_at = now() WHERE id = $1', [solutionId]);
  }
  return rowCount > 0;
}

module.exports = { findByType, upsert, remove };
