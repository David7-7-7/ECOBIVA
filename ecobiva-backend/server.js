require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const rolRoutes = require("./routes/rolRoutes");
const verificarToken = require("./middlewares/verificarToken");
const verificarRol = require("./middlewares/verificarRol");
const permisoRoutes = require("./routes/permisoRoutes");
const auditoriaRoutes = require("./routes/auditoriaRoutes");
const perfilRoutes = require("./routes/perfilRoutes");
const empleadoRoutes = require("./routes/empleadoRoutes");
const historialCargoRoutes = require("./routes/historialCargoRoutes");
const nominaRoutes = require("./routes/nominaRoutes");
const clienteRoutes = require("./routes/clienteRoutes");
const vehiculoRoutes = require("./routes/vehiculoRoutes");
const repuestoRoutes = require("./routes/repuestoRoutes");
const bateriaRoutes = require("./routes/bateriaRoutes");
const kardexRoutes = require("./routes/kardexRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mensaje: "Servidor ECOBIVA corriendo 🚗🔋" });
});

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/roles", rolRoutes);
app.use("/api/permisos", permisoRoutes);
app.use("/api/auditoria", auditoriaRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/empleados", empleadoRoutes);
app.use("/api/historial-cargo", historialCargoRoutes);
app.use("/api/nominas", nominaRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/vehiculos", vehiculoRoutes);
app.use("/api/repuestos", repuestoRoutes);
app.use("/api/baterias", bateriaRoutes);
app.use("/api/kardex", kardexRoutes);

// Ruta de prueba para confirmar que los middlewares funcionan.
app.get(
  "/api/test-protegido",
  verificarToken,
  verificarRol(["Admin"]),
  (req, res) => {
    res.json({
      mensaje: "Si ves esto, el token y el rol son válidos ✅",
      usuario: req.usuario,
    });
  },
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
