const db = require('../config/db');

const PUBLIC_COLUMNS = 'id, full_name, email, role, created_at';

function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

async function findById(id) {
  const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return toPublicUser(rows[0]);
}

// Devuelve la fila completa (incluye password_hash); usar solo para validar credenciales.
async function findByEmailWithHash(email) {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function create({ fullName, email, passwordHash, role = 'consultant' }) {
  const { rows } = await db.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PUBLIC_COLUMNS}`,
    [fullName, email, passwordHash, role]
  );
  return toPublicUser(rows[0]);
}

async function list() {
  const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users ORDER BY created_at`);
  return rows.map(toPublicUser);
}

async function updateRole(id, role) {
  const { rows } = await db.query(
    `UPDATE users SET role = $2 WHERE id = $1 RETURNING ${PUBLIC_COLUMNS}`,
    [id, role]
  );
  return toPublicUser(rows[0]);
}

async function remove(id) {
  const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { toPublicUser, findById, findByEmailWithHash, create, list, updateRole, remove };
