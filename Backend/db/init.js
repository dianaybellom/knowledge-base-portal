const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { pool } = require('../src/config/db');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('[db:init] Esquema creado correctamente.');
}

main()
  .catch((err) => {
    console.error('[db:init] Falló:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
