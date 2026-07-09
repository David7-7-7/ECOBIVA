/**
 * Valida que la contraseña cumpla: mínimo 8 caracteres,
 * 1 mayúscula, 1 minúscula, 1 número, 1 símbolo.
 */
function validarPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return { valido: false, error: 'La contraseña debe tener mínimo 8 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valido: false, error: 'La contraseña debe tener al menos 1 mayúscula' };
  }
  if (!/[a-z]/.test(password)) {
    return { valido: false, error: 'La contraseña debe tener al menos 1 minúscula' };
  }
  if (!/[0-9]/.test(password)) {
    return { valido: false, error: 'La contraseña debe tener al menos 1 número' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valido: false, error: 'La contraseña debe tener al menos 1 símbolo' };
  }
  return { valido: true };
}

module.exports = validarPassword;