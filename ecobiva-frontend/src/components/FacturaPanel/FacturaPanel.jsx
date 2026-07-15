import { useEffect, useState } from "react";
import "./FacturaPanel.css";
import jsPDF from "jspdf";

import { useAuth } from "../../context/AuthContext";
import {
  obtenerFacturasPorOrden,
  marcarFacturaPagada,
} from "../../services/facturaService";
import {
  obtenerReparacion,
  listarRepuestosReparacion,
} from "../../services/reparacionService";

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Transferencia", "Otro"];

const TIPO_LABELS = {
  diagnostico: "Diagnóstico",
  reparacion: "Reparación",
};

export default function FacturaPanel({ orden, onOrdenActualizada }) {
  const { tieneAlgunRol } = useAuth();
  const puedeFacturar = tieneAlgunRol(["Admin", "Asesor"]);

  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pagoEnCurso, setPagoEnCurso] = useState(null);
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);
  const [generandoPdf, setGenerandoPdf] = useState(null);

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

  const descargarPdf = async (factura) => {
    setGenerandoPdf(factura.idFactura);

    try {
      // La factura solo guarda los subtotales. El detalle (descripción de
      // mano de obra y el listado de repuestos usados) vive en Reparacion /
      // ReparacionRepuesto, así que para una factura tipo "reparacion" hay
      // que ir a buscarlo aparte. Para tipo "diagnostico" no hace falta:
      // subtotalManoObra ya es el costo del diagnóstico profundo y no hay
      // repuestos asociados.
      let descripcionManoObra = "";
      let repuestos = [];

      if (factura.tipo === "reparacion") {
        try {
          const [reparacion, listaRepuestos] = await Promise.all([
            obtenerReparacion(orden.idOrden),
            listarRepuestosReparacion(orden.idOrden),
          ]);
          descripcionManoObra = reparacion?.descripcionManoObra || "";
          repuestos = listaRepuestos || [];
        } catch (error) {
          console.error(error);
        }
      }

      const doc = new jsPDF();
      const margenIzq = 15;
      let y = 20;

      const saltoDeLinea = (alto = 7) => {
        y += alto;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      };

      doc.setFontSize(16);
      doc.text("Factura", margenIzq, y);
      saltoDeLinea(10);

      doc.setFontSize(11);
      doc.text(`Número: ${factura.numeroFactura || ""}`, margenIzq, y);
      saltoDeLinea();
      doc.text(`Tipo: ${TIPO_LABELS[factura.tipo] || factura.tipo}`, margenIzq, y);
      saltoDeLinea();
      doc.text(
        `Fecha de emisión: ${
          factura.fechaEmision
            ? new Date(factura.fechaEmision).toLocaleDateString()
            : "-"
        }`,
        margenIzq,
        y,
      );
      saltoDeLinea(10);

      doc.text(`Orden: ${orden.folio || ""}`, margenIzq, y);
      saltoDeLinea();
      doc.text(`Cliente: ${orden.clienteNombre || "-"}`, margenIzq, y);
      saltoDeLinea();
      doc.text(
        `Vehículo: ${orden.vehiculoPlaca || ""} ${orden.vehiculoMarca || ""} ${orden.vehiculoModelo || ""}`.trim(),
        margenIzq,
        y,
      );
      saltoDeLinea(10);

      doc.setFont(undefined, "bold");
      doc.text("Mano de obra", margenIzq, y);
      doc.setFont(undefined, "normal");
      saltoDeLinea();
      if (descripcionManoObra) {
        const descripcionLineas = doc.splitTextToSize(descripcionManoObra, 180);
        doc.text(descripcionLineas, margenIzq, y);
        saltoDeLinea(descripcionLineas.length * 6);
      }
      doc.text(`Subtotal mano de obra: $${factura.subtotalManoObra ?? 0}`, margenIzq, y);
      saltoDeLinea(10);

      doc.setFont(undefined, "bold");
      doc.text("Repuestos usados", margenIzq, y);
      doc.setFont(undefined, "normal");
      saltoDeLinea();
      if (repuestos.length === 0) {
        doc.text("Sin repuestos registrados.", margenIzq, y);
        saltoDeLinea();
      } else {
        repuestos.forEach((rep) => {
          const linea = `• ${rep.repuestoNombre} x${rep.cantidad} — $${rep.precioUnitario} c/u${
            rep.descripcion ? ` (${rep.descripcion})` : ""
          }`;
          const lineasDivididas = doc.splitTextToSize(linea, 180);
          doc.text(lineasDivididas, margenIzq, y);
          saltoDeLinea(lineasDivididas.length * 6);
        });
      }
      doc.text(`Subtotal repuestos: $${factura.subtotalRepuestos ?? 0}`, margenIzq, y);
      saltoDeLinea(10);

      doc.setFont(undefined, "bold");
      doc.text("Totales", margenIzq, y);
      doc.setFont(undefined, "normal");
      saltoDeLinea();
      doc.text(`Descuento: $${factura.descuento ?? 0}`, margenIzq, y);
      saltoDeLinea();
      doc.text(`Impuestos: $${factura.impuestos ?? 0}`, margenIzq, y);
      saltoDeLinea();
      doc.setFont(undefined, "bold");
      doc.text(`Total: $${factura.total ?? 0}`, margenIzq, y);
      doc.setFont(undefined, "normal");
      saltoDeLinea(10);

      doc.text(
        `Estado de pago: ${factura.pagoConfirmado ? "Pagada" : "Pendiente"}`,
        margenIzq,
        y,
      );
      saltoDeLinea();
      if (factura.pagoConfirmado) {
        doc.text(`Método de pago: ${factura.metodoPago || "-"}`, margenIzq, y);
        saltoDeLinea();
        doc.text(
          `Fecha de pago: ${
            factura.fechaPago ? new Date(factura.fechaPago).toLocaleDateString() : "-"
          }`,
          margenIzq,
          y,
        );
        saltoDeLinea();
      }

      doc.save(`factura-${factura.numeroFactura || factura.idFactura}.pdf`);
    } catch (error) {
      console.error(error);
      alert("No fue posible generar el PDF de la factura.");
    } finally {
      setGenerandoPdf(null);
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
                  <div className="facturaAcciones">
                    <button
                      className="btnPdf"
                      onClick={() => descargarPdf(factura)}
                      disabled={generandoPdf === factura.idFactura}
                    >
                      {generandoPdf === factura.idFactura
                        ? "Generando..."
                        : "PDF"}
                    </button>

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
                  </div>
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
    </section>
  );
}
