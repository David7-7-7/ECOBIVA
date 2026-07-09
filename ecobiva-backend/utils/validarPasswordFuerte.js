// Si ya tienes utils/validarPassword.js con esta misma lógica, no necesitas
// este archivo: solo reutiliza el que ya existe en el import de perfilController.js
//
// Regla: mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 símbolo.
function esPasswordFuerte(password) {
    const regla = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    return regla.test(password);
}

module.exports = { esPasswordFuerte };
