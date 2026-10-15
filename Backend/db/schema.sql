-- Esquema del Knowledge Base Portal (prototipo: recrea todas las tablas desde cero)
-- gen_random_uuid() es nativo desde PostgreSQL 13.

DROP TABLE IF EXISTS doc_sections CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS components CASCADE;
DROP TABLE IF EXISTS solution_members CASCADE;
DROP TABLE IF EXISTS solutions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'consultant'
    CHECK (role IN ('consultant', 'author', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) UNIQUE NOT NULL
    CHECK (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name VARCHAR(120) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('addon', 'plugin', 'integration')),
  summary VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  doc_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (doc_status IN ('complete', 'partial', 'pending')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE solution_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('po', 'dev')),
  position INT NOT NULL DEFAULT 0
);

CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  version VARCHAR(30) NOT NULL,
  file_key TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Una fila por sección: contiene el Markdown completo de esa sección
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL
    CHECK (type IN ('technical', 'release-notes', 'user-guide', 'fact-sheet')),
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (solution_id, type)
);

-- Como máximo un PO por solución
CREATE UNIQUE INDEX uq_solution_members_one_po ON solution_members (solution_id) WHERE role = 'po';

CREATE INDEX idx_solutions_updated_at ON solutions (updated_at DESC);
CREATE INDEX idx_solution_members_solution_position ON solution_members (solution_id, position);
CREATE INDEX idx_components_solution_id ON components (solution_id);
-- Novedades recientes: secciones de un tipo ordenadas por fecha
CREATE INDEX idx_documents_type_updated_at ON documents (type, updated_at DESC);