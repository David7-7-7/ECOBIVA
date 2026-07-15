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
const tecnicoRoutes = require("./routes/tecnicoRoutes");
const historialCargoRoutes = require("./routes/historialCargoRoutes");
const nominaRoutes = require("./routes/nominaRoutes");
const clienteRoutes = require("./routes/clienteRoutes");
const vehiculoRoutes = require("./routes/vehiculoRoutes");
const repuestoRoutes = require("./routes/repuestoRoutes");
const bateriaRoutes = require("./routes/bateriaRoutes");
const kardexRoutes = require("./routes/kardexRoutes");
const ordenRoutes = require("./routes/ordenRoutes");
const diagnosticoRoutes = require("./routes/diagnosticoRoutes");
const reparacionRoutes = require("./routes/reparacionRoutes");
const facturaRoutes = require("./routes/facturaRoutes");
const evidenciaRoutes = require("./routes/evidenciaRoutes");
const alertaStockRoutes = require("./routes/alertaStockRoutes");
const ordenGarantiaRoutes = require("./routes/ordenGarantiaRoutes");
const terminoGarantiaRoutes = require("./routes/terminoGarantiaRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

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
app.use("/api/tecnicos", tecnicoRoutes);
app.use("/api/historial-cargo", historialCargoRoutes);
app.use("/api/nominas", nominaRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/vehiculos", vehiculoRoutes);
app.use("/api/repuestos", repuestoRoutes);
app.use("/api/baterias", bateriaRoutes);
app.use("/api/kardex", kardexRoutes);
app.use("/api/ordenes", ordenRoutes);
app.use("/api/diagnosticos", diagnosticoRoutes);
app.use("/api/reparaciones", reparacionRoutes);
app.use("/api/facturas", facturaRoutes);
app.use("/api/evidencias", evidenciaRoutes);
app.use("/api/alertas-stock", alertaStockRoutes);
app.use("/api/ordenes-garantia", ordenGarantiaRoutes);
app.use("/api/terminos-garantia", terminoGarantiaRoutes);

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
