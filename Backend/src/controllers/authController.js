const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const users = require('../models/users');
const { HttpError } = require('../middleware/errors');

const BCRYPT_ROUNDS = 10;
// Hash usado cuando el email no existe, para que ambos caminos del login tarden lo mismo.
const DUMMY_HASH = bcrypt.hashSync('timing-attack-placeholder', BCRYPT_ROUNDS);

const emailField = z
  .string({ required_error: 'El correo es obligatorio.' })
  .trim()
  .toLowerCase()
  .min(1, 'El correo es obligatorio.')
  .max(160, 'El correo no puede superar 160 caracteres.')
  .email('Ingresa un correo válido.');

const registerSchema = z.object({
  fullName: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(120, 'El nombre no puede superar 120 caracteres.'),
  email: emailField,
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    // bcrypt solo usa los primeros 72 bytes.
    .max(72, 'La contraseña no puede superar 72 caracteres.'),
});

const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(1, 'La contraseña es obligatoria.'),
});

function signToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role, name: user.fullName },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

async function register(req, res) {
  const data = registerSchema.parse(req.body ?? {});

  const existing = await users.findByEmailWithHash(data.email);
  if (existing) {
    throw new HttpError(409, 'Ya existe una cuenta con ese correo.');
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const user = await users.create({ fullName: data.fullName, email: data.email, passwordHash });

  res.status(201).json({ token: signToken(user), user });
}

async function login(req, res) {
  const data = loginSchema.parse(req.body ?? {});

  const row = await users.findByEmailWithHash(data.email);
  const isValid = await bcrypt.compare(data.password, row ? row.password_hash : DUMMY_HASH);
  if (!row || !isValid) {
    throw new HttpError(401, 'Credenciales inválidas.');
  }

  const user = users.toPublicUser(row);
  res.json({ token: signToken(user), user });
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };
