const multer = require("multer");
const path = require("path");
const fs = require("fs");

const carpeta = path.join(__dirname, "..", "uploads", "evidencias");

if (!fs.existsSync(carpeta)) {
    fs.mkdirSync(carpeta, { recursive: true });
}

const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, carpeta);

    },

    filename(req, file, cb) {

        const extension = path.extname(file.originalname);

        const nombre =
            Date.now() +
            "_" +
            Math.round(Math.random() * 1000000) +
            extension;

        cb(null, nombre);

    }

});

function filtroImagen(req, file, cb) {

    const tipos = /jpg|jpeg|png|webp/i;

    const extension = tipos.test(path.extname(file.originalname));

    const mime = tipos.test(file.mimetype);

    if (extension && mime) {

        return cb(null, true);

    }

    cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP"));

}

module.exports = multer({

    storage,

    fileFilter: filtroImagen,

    limits: {

        fileSize: 5 * 1024 * 1024

    }

});