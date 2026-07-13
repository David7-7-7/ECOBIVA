import { useEffect, useState } from "react";
import "./FacturaPanel.css";

import Button from "../Button/Button";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerFacturasPorOrden,
  crearFacturaReparacion,
  marcarFacturaPagada,
} from "../../services/facturaService";

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia", "Otro"];

const TIPO_LABELS = {
  diagnostico: "Diagnóstico",
  reparacion: "Reparación",
};

const inicializarNuevaFactura = () => ({
  subtotalManoObra: "",
  subtotalRepuestos: "",
  descuento: "",
  impuestos: "",
});

export default function FacturaPanel({ orden, onOrdenActualizada }) {
  const { tieneAlgunRol } = useAuth();
  const puedeFacturar = tieneAlgunRol(["Admin", "Asesor"]);

  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevaFactura, setNuevaFactura] = useState(inicializarNuevaFactura());
  const [creando, setCreando] = useState(false);
  const [pagoEnCurso, setPagoEnCurso] = useState(null);
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden.idOrden]);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await obtenerFacturasPorOrden(orden.idOrden);
      setFacturas(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const tieneFacturaReparacion = facturas.some((f) => f.tipo === "reparacion");
  const puedeCrearReparacion =
    puedeFacturar && orden.estado === "finalizada" && !tieneFacturaReparacion;

  const calcularTotal = () => {
    const manoObra = Number(nuevaFactura.subtotalManoObra || 0);
    const repuestos = Number(nuevaFactura.subtotalRepuestos || 0);
    const descuento = Number(nuevaFactura.descuento || 0);
    const impuestos = Number(nuevaFactura.impuestos || 0);
    return manoObra + repuestos + impuestos - descuento;
  };

  const crearFactura = async () => {
    setCreando(true);
    try {
      await crearFacturaReparacion({
        idOrdenServicio: orden.idOrden,
        subtotalManoObra: Number(nuevaFactura.subtotalManoObra || 0),
        subtotalRepuestos: Number(nuevaFactura.subtotalRepuestos || 0),
        descuento: Number(nuevaFactura.descuento || 0),
        impuestos: Number(nuevaFactura.impuestos || 0),
      });
      setNuevaFactura(inicializarNuevaFactura());
      await cargar();
      if (onOrdenActualizada) await onOrdenActualizada();
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.error || "No fue posible crear la factura.",
      );
    } finally {
      setCreando(false);
    }
  };

  const pagar = async (idFactura) => {
    setPagoEnCurso(idFactura);
    try {
      await marcarFacturaPagada(idFactura, { metodoPago });
      await cargar();
      if (onOrdenActualizada) await onOrdenActualizada();
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.error ||
          "No fue posible marcar la factura como pagada.",
      );
    } finally {
      setPagoEnCurso(null);
    }
  };

  if (cargando) {
    return (
      <section className="detailSection">
        <h3>Facturación</h3>
        <p className="observaciones">Cargando facturas...</p>
      </section>
    );
  }

  return (
    <section className="detailSection">
      <h3>Facturación</h3>

      {facturas.length === 0 ? (
        <p className="observaciones">
          Esta orden todavía no tiene facturas asociadas.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Número</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado de pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((factura) => (
              <tr key={factura.idFactura}>
                <td>{factura.numeroFactura}</td>
                <td>{TIPO_LABELS[factura.tipo] || factura.tipo}</td>
                <td>
                  {factura.fechaEmision
                    ? new Date(factura.fechaEmision).toLocaleDateString()
                    : "-"}
                </td>
                <td>{factura.total}</td>
                <td>{factura.pagoConfirmado ? "Pagada" : "Pendiente"}</td>
                <td>
                  {puedeFacturar && !factura.pagoConfirmado && (
                    <button
                      className="btnPagar"
                      onClick={() => pagar(factura.idFactura)}
                      disabled={pagoEnCurso === factura.idFactura}
                    >
                      {pagoEnCurso === factura.idFactura
                        ? "Marcando..."
                        : "Marcar pagada"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {facturas.some((f) => !f.pagoConfirmado) && puedeFacturar && (
        <div className="inputGroup facturaMetodoPago">
          <label>Método de pago para el cobro</label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
          >
            {METODOS_PAGO.map((metodo) => (
              <option key={metodo} value={metodo}>
                {metodo}
              </option>
            ))}
          </select>
        </div>
      )}

      {puedeCrearReparacion && (
        <div className="facturaNueva">
          <h4>Crear factura de reparación</h4>
          <div className="detailGrid">
            <div className="inputGroup">
              <label>Mano de obra</label>
              <input
                type="number"
                value={nuevaFactura.subtotalManoObra}
                onChange={(e) =>
                  setNuevaFactura({
                    ...nuevaFactura,
                    subtotalManoObra: e.target.value,
                  })
                }
              />
            </div>
            <div className="inputGroup">
              <label>Repuestos</label>
              <input
                type="number"
                value={nuevaFactura.subtotalRepuestos}
                onChange={(e) =>
                  setNuevaFactura({
                    ...nuevaFactura,
                    subtotalRepuestos: e.target.value,
                  })
                }
              />
            </div>
            <div className="inputGroup">
              <label>Descuento</label>
              <input
                type="number"
                value={nuevaFactura.descuento}
                onChange={(e) =>
                  setNuevaFactura({
                    ...nuevaFactura,
                    descuento: e.target.value,
                  })
                }
              />
            </div>
            <div className="inputGroup">
              <label>Impuestos</label>
              <input
                type="number"
                value={nuevaFactura.impuestos}
                onChange={(e) =>
                  setNuevaFactura({
                    ...nuevaFactura,
                    impuestos: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <p className="facturaTotal">
            Total estimado: <strong>{calcularTotal()}</strong>
          </p>
          <Button variant="primary" onClick={crearFactura} disabled={creando}>
            {creando ? "Creando..." : "Crear factura de reparación"}
          </Button>
        </div>
      )}
    </section>
  );
}
