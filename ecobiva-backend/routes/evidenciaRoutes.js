const express = require("express");
const router = express.Router();

const evidenciaController = require("../controllers/evidenciaController");

const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

const upload = require("../middlewares/upload");

router.use(verificarToken);

/*
|--------------------------------------------------------------------------
| CONSULTAS
|--------------------------------------------------------------------------
*/

router.get(
    "/orden/:id",
    verificarRol(["Admin", "Asesor", "Tecnico"]),
    evidenciaController.listarPorOrden
);

router.get(
    "/:id",
    verificarRol(["Admin", "Asesor", "Tecnico"]),
    evidenciaController.obtenerPorId
);

router.get(
    "/:id/fotos",
    verificarRol(["Admin", "Asesor", "Tecnico"]),
    evidenciaController.listarFotos
);

/*
|--------------------------------------------------------------------------
| CRUD
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    verificarRol(["Admin", "Asesor"]),
    evidenciaController.crear
);

router.put(
    "/:id",
    verificarRol(["Admin", "Asesor"]),
    evidenciaController.actualizar
);

router.delete(
    "/:id",
    verificarRol(["Admin", "Asesor"]),
    evidenciaController.eliminar
);

/*
|--------------------------------------------------------------------------
| FOTOGRAFÍAS
|--------------------------------------------------------------------------
*/

router.post(
    "/foto",
    verificarRol(["Admin","Asesor"]),
    upload.single("foto"),
    evidenciaController.agregarFoto
);

router.delete(
    "/foto/:id",
    verificarRol(["Admin", "Asesor"]),
    evidenciaController.eliminarFoto
);

module.exports = router;