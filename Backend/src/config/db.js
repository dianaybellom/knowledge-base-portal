const { Pool } = require('pg');

// Neon exige SSL; sus certificados son de confianza pública, así que se verifican.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 10,
});

pool.on('error', (err) => {
  console.error('[db] Error inesperado en un cliente inactivo:', err.message);
});

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
