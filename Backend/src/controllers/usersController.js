const { z } = require('zod');
const users = require('../models/users');
const { HttpError } = require('../middleware/errors');
const { USER_ROLES } = require('../utils/catalog');
const { isUuid, enumField } = require('../utils/validation');

const roleSchema = z.object({ role: enumField(USER_ROLES, 'El rol') });

function assertUserId(id) {
  if (!isUuid(id)) throw new HttpError(404, 'Usuario no encontrado.');
}

async function list(req, res) {
  res.json({ users: await users.list() });
}

async function updateRole(req, res) {
  assertUserId(req.params.id);
  const { role } = roleSchema.parse(req.body ?? {});

  if (req.params.id === req.user.id && role !== 'admin') {
    throw new HttpError(400, 'No puedes quitarte el rol de administrador.');
  }

  const user = await users.updateRole(req.params.id, role);
  if (!user) throw new HttpError(404, 'Usuario no encontrado.');
  res.json({ user });
}

async function remove(req, res) {
  assertUserId(req.params.id);

  if (req.params.id === req.user.id) {
    throw new HttpError(400, 'No puedes eliminar tu propia cuenta.');
  }

  const deleted = await users.remove(req.params.id);
  if (!deleted) throw new HttpError(404, 'Usuario no encontrado.');
  res.status(204).end();
}

module.exports = { list, updateRole, remove };
