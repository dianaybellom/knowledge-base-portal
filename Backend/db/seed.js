const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

const SAMPLE_SOLUTIONS = [
  {
    code: 'accessibility-assistant',
    name: 'Asistente de Accesibilidad',
    type: 'plugin',
    summary:
      'Plugin para el punto de venta que lee en voz alta productos y totales, y permite operar la caja solo con el teclado.',
    description: [
      'Componente que permite a los usuarios ajustar la presentación de la interfaz del punto de venta según sus necesidades visuales y motoras, sin requerir intervención de soporte. Aplica las preferencias de forma persistente por usuario.',
      '',
      '## Funcionalidades',
      '',
      '- Lectura en voz alta de productos escaneados, subtotales y total a pagar.',
      '- Ajuste de contraste y tamaño de fuente.',
      '- Navegación completa por teclado.',
      '- Perfiles de accesibilidad por usuario.',
    ].join('\n'),
    docStatus: 'complete',
    // Fechas fijas (anteriores al 25/09/2026) para que las novedades tengan un orden visible
    createdAt: '2026-05-04T09:00:00-04:00',
    updatedAt: '2026-09-22T10:30:00-04:00',
    members: [
      { name: 'Laura Méndez', role: 'po' },
      { name: 'Carlos Ríos', role: 'dev' },
      { name: 'Ana Torres', role: 'dev' },
    ],
    components: [
      { name: 'Plugin POS Accesibilidad', version: '2.1.0' },
      { name: 'Paquete de voces en español', version: '1.0.3' },
    ],
    documents: [
      {
        type: 'technical',
        updatedAt: '2026-09-10T15:00:00-04:00',
        content: [
          'El Asistente de Accesibilidad se configura desde la tabla de parámetros del sistema. Esta guía describe las propiedades disponibles, sus valores admitidos y el comportamiento por defecto de cada una.',
          '',
          '## Introducción',
          '',
          'El plugin permite que personas con discapacidad visual operen el punto de venta de forma autónoma. Es compatible con la versión 5.x del punto de venta en Windows 10 y 11.',
          '',
          '## Parámetros del sistema',
          '',
          'Los parámetros se aplican por usuario y se conservan entre sesiones. Los cambios toman efecto al reiniciar la sesión del cliente.',
          '',
          '### Propiedades de configuración',
          '',
          '| Código | Descripción | Valor por defecto |',
          '|---|---|---|',
          '| `ACC_CONTRAST_MODE` | Modo de contraste de la interfaz | `normal` |',
          '| `ACC_FONT_SCALE` | Factor de escala de la tipografía | `1.0` |',
          '| `ACC_KEYBOARD_NAV` | Habilita la navegación por teclado | `true` |',
          '| `ACC_SPEECH_RATE` | Velocidad de lectura (0.5 a 2.0) | `1.0` |',
          '',
          '## Video de configuración',
          '',
          'El siguiente video presenta los principios de accesibilidad en los que se basa el plugin.',
          '',
          '<div class="video-embed">',
          '  <iframe src="https://www.youtube-nocookie.com/embed/20SHvU2PKsM" title="Introducción a la accesibilidad web y los estándares del W3C" allowfullscreen></iframe>',
          '</div>',
        ].join('\n'),
      },
      {
        type: 'release-notes',
        updatedAt: '2026-09-22T10:30:00-04:00',
        content: [
          '## Versión 2.1.0',
          '',
          '- Nuevo parámetro `ACC_SPEECH_RATE` para ajustar la velocidad de lectura.',
          '- Corrección: el total se leía dos veces al aplicar descuentos.',
          '',
          '## Versión 2.0.0',
          '',
          '- Perfiles de accesibilidad por usuario.',
          '- Paquete de voces en español como componente independiente.',
          '',
          '## Versión 1.0.0',
          '',
          '- Primera versión: lectura de productos y totales, y navegación por teclado.',
        ].join('\n'),
      },
      {
        type: 'user-guide',
        updatedAt: '2026-08-28T11:00:00-04:00',
        content: [
          '## Activar el perfil de accesibilidad',
          '',
          '1. Inicia sesión en el punto de venta.',
          '2. Presiona `Ctrl + Alt + A` para activar tu perfil.',
          '3. Escucha la confirmación: "Perfil de accesibilidad activado".',
          '',
          '## Atajos de teclado',
          '',
          '| Atajo | Acción |',
          '|---|---|',
          '| `F2` | Repetir el último producto |',
          '| `F3` | Leer el subtotal |',
          '| `F4` | Leer el total a pagar |',
        ].join('\n'),
      },
      {
        type: 'fact-sheet',
        updatedAt: '2026-08-14T16:00:00-04:00',
        content: [
          '## En resumen',
          '',
          '- **Tipo:** plugin del punto de venta.',
          '- **Usuarios:** cajeros y clientes con discapacidad visual o motora.',
          '- **Requisitos:** punto de venta 5.x, Windows 10 u 11 y altavoces o audífonos.',
          '- **Beneficio:** operación autónoma de la caja sin apoyo de soporte.',
        ].join('\n'),
      },
    ],
  },
  {
    code: 'e-invoicing-connector',
    name: 'Conector de Facturación Electrónica',
    type: 'integration',
    summary:
      'Integración entre el ERP y el proveedor de facturación electrónica que envía las facturas y recupera su estado de validación.',
    description: [
      'Automatiza el envío de facturas desde el ERP al proveedor de facturación electrónica y actualiza en el ERP el estado de validación de cada documento.',
      '',
      '## Funcionalidades',
      '',
      '- Envío automático de facturas al confirmarlas en el ERP.',
      '- Consulta periódica del estado de validación.',
      '- Reintentos ante fallos de comunicación.',
    ].join('\n'),
    docStatus: 'partial',
    createdAt: '2026-06-15T09:00:00-04:00',
    updatedAt: '2026-09-18T14:15:00-04:00',
    members: [
      { name: 'Carlos Ríos', role: 'po' },
      { name: 'Miguel Peña', role: 'dev' },
    ],
    components: [{ name: 'Servicio de sincronización', version: '1.4.2' }],
    documents: [
      {
        type: 'technical',
        updatedAt: '2026-09-05T12:00:00-04:00',
        content: [
          '## Objetivo',
          '',
          'Automatizar el envío de facturas desde el ERP al proveedor de facturación electrónica.',
          '',
          '> La documentación de configuración está en proceso.',
        ].join('\n'),
      },
    ],
  },
  {
    code: 'multi-warehouse-inventory',
    name: 'Addon de Inventario Multibodega',
    type: 'addon',
    summary: 'Addon del ERP que controla existencias en varias bodegas y genera traslados entre ellas.',
    description: [
      'Permite llevar el inventario de varias bodegas desde el ERP y mover mercancía entre ellas con trazabilidad.',
      '',
      '## Funcionalidades',
      '',
      '- Existencias por bodega.',
      '- Traslados entre bodegas con aprobación.',
    ].join('\n'),
    docStatus: 'pending',
    createdAt: '2026-07-20T09:00:00-04:00',
    updatedAt: '2026-09-12T09:45:00-04:00',
    members: [{ name: 'Ana Torres', role: 'po' }],
    components: [{ name: 'Addon Multibodega', version: '0.9.0' }],
    documents: [],
  },
];

async function seedAdmin(client) {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL y ADMIN_PASSWORD son obligatorios en el .env');
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres');
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  // Idempotente: si el admin ya existe, el .env sigue siendo la fuente de verdad.
  const { rows } = await client.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           password_hash = EXCLUDED.password_hash,
           role = 'admin'
     RETURNING id`,
    [ADMIN_NAME || 'Administrador', ADMIN_EMAIL.trim().toLowerCase(), passwordHash]
  );
  return rows[0].id;
}

async function seedSolution(client, solution, adminId) {
  const existing = await client.query('SELECT id FROM solutions WHERE code = $1', [solution.code]);
  if (existing.rows.length > 0) {
    console.log(`[db:seed] Omitida (ya existe): ${solution.code}`);
    return;
  }

  const { rows } = await client.query(
    `INSERT INTO solutions (code, name, type, summary, description, doc_status, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      solution.code,
      solution.name,
      solution.type,
      solution.summary,
      solution.description,
      solution.docStatus,
      adminId,
      solution.createdAt,
      solution.updatedAt,
    ]
  );
  const solutionId = rows[0].id;

  for (const [index, member] of solution.members.entries()) {
    await client.query(
      'INSERT INTO solution_members (solution_id, name, role, position) VALUES ($1, $2, $3, $4)',
      [solutionId, member.name, member.role, index]
    );
  }

  for (const component of solution.components) {
    await client.query(
      'INSERT INTO components (solution_id, name, version, created_at) VALUES ($1, $2, $3, $4)',
      [solutionId, component.name, component.version, solution.createdAt]
    );
  }

  for (const document of solution.documents) {
    await client.query(
      'INSERT INTO documents (solution_id, type, content, updated_at) VALUES ($1, $2, $3, $4)',
      [solutionId, document.type, document.content, document.updatedAt]
    );
  }

  console.log(`[db:seed] Creada: ${solution.code}`);
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const adminId = await seedAdmin(client);
    console.log(`[db:seed] Admin listo: ${process.env.ADMIN_EMAIL}`);
    for (const solution of SAMPLE_SOLUTIONS) {
      await seedSolution(client, solution, adminId);
    }
    await client.query('COMMIT');
    console.log('[db:seed] Terminado.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

main()
  .catch((err) => {
    console.error('[db:seed] Falló:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
