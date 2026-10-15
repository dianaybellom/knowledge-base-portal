const jwt = require('jsonwebtoken');
const users = require('../models/users');
const { HttpError } = require('./errors');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Debes iniciar sesión para continuar.');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Tu sesión expiró. Inicia sesión de nuevo.'
      : 'La sesión no es válida. Inicia sesión de nuevo.';
    throw new HttpError(401, message);
  }

  // Se carga el usuario actual para que los cambios de rol y las eliminaciones apliquen de inmediato.
  const user = await users.findById(payload.sub);
  if (!user) {
    throw new HttpError(401, 'La cuenta ya no existe. Inicia sesión de nuevo.');
  }

  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(403, 'No tienes permiso para realizar esta acción.');
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
