import "./Inventario.css";

import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import DetailModal from "../../components/DetailModal/DetailModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import ProductoDetail from "../../components/ProductoDetail/ProductoDetail";
import SearchBar from "../../components/SearchBar/SearchBar";
import InventarioModal from "../../components/InventarioModal/InventarioModal";
import {
  obtenerRepuestos,
  crearRepuesto,
  actualizarRepuesto,
  eliminarRepuesto,
} from "../../services/repuestoService";
import {
  obtenerBaterias,
  crearBateria,
  actualizarBateria,
  eliminarBateria,
} from "../../services/bateriaService";
import { obtenerKardex } from "../../services/kardexService";

export default function Inventario() {
  const [modo, setModo] = useState("repuestos");
  const [repuestos, setRepuestos] = useState([]);
  const [baterias, setBaterias] = useState([]);
  const [kardex, setKardex] = useState([]);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [productoModal, setProductoModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const [listaRepuestos, listaBaterias, listaKardex] = await Promise.all([
        obtenerRepuestos(),
        obtenerBaterias(),
        obtenerKardex(),
      ]);
      setRepuestos(listaRepuestos);
      setBaterias(listaBaterias);
      setKardex(listaKardex);
      setError("");
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el inventario.");
    }
  }

  async function eliminar(item) {
    try {
      if (modo === "baterias") {
        await eliminarBateria(item.idRepuesto);
      } else {
        await eliminarRepuesto(item.idRepuesto);
      }
      await cargarDatos();
      setConfirmDelete(false);
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el registro.");
    }
  }

  function abrirModal(producto = null) {
    setProductoModal(producto);
    setModalOpen(true);
    setError("");
  }

  function cerrarModal() {
    setModalOpen(false);
    setProductoModal(null);
  }

  async function guardarProducto(producto) {
    try {
      if (modo === "baterias") {
        if (producto.idRepuesto) {
          await actualizarBateria(producto.idRepuesto, producto);
        } else {
          await crearBateria(producto);
        }
      } else {
        if (producto.idRepuesto) {
          await actualizarRepuesto(producto.idRepuesto, producto);
        } else {
          await crearRepuesto(producto);
        }
      }

      await cargarDatos();
      cerrarModal();
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al guardar el producto.");
    }
  }

  const productosFiltrados = (modo === "baterias" ? baterias : repuestos).filter((producto) => {
    if (!busqueda) return true;
    return producto.nombre?.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle="Control de repuestos, baterías y kardex."
      />

      <div className="inventarioCard">
        <div className="inventarioTabs">
          <button className={modo === "repuestos" ? "active" : ""} onClick={() => setModo("repuestos")}>Repuestos</button>
          <button className={modo === "baterias" ? "active" : ""} onClick={() => setModo("baterias")}>Baterías</button>
          <button className={modo === "kardex" ? "active" : ""} onClick={() => setModo("kardex")}>Kardex</button>
        </div>

        {modo !== "kardex" && (
          <div className="inventarioActions">
            <SearchBar
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button className="btnNuevo" onClick={() => abrirModal(null)}>
              <span>Nuevo {modo === "baterias" ? "Registro" : "Producto"}</span>
            </button>
          </div>
        )}

        {error && <div className="errorMensaje">{error}</div>}

        {modo === "repuestos" && (
          <div className="tableWrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Proveedor</th>
                <th>Stock</th>
                <th>Stock mínimo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((producto) => (
                <tr key={producto.idRepuesto}>
                  <td>{producto.nombre}</td>
                  <td>{producto.categoria}</td>
                  <td>{producto.precioUnitario}</td>
                  <td>{producto.proveedor}</td>
                  <td>{producto.stockActual}</td>
                  <td>{producto.stockMinimo}</td>
                  <td><StatusBadge status={producto.estado} /></td>
                  <td>
                    <ActionButtons
                      onView={() => {
                        setProductoSeleccionado(producto);
                        setDetalleOpen(true);
                      }}
                      onEdit={() => abrirModal(producto)}
                      onDelete={() => {
                        setProductoSeleccionado(producto);
                        setConfirmDelete(true);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {modo === "baterias" && (
          <div className="tableWrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Serial</th>
                <th>Modelo</th>
                <th>Voltaje</th>
                <th>Amperaje</th>
                <th>Vehículo</th>
                <th>Stock</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((producto) => (
                <tr key={producto.idRepuesto}>
                  <td>{producto.nombre}</td>
                  <td>{producto.serial}</td>
                  <td>{producto.modeloCompatible}</td>
                  <td>{producto.voltajeFinal}</td>
                  <td>{producto.amperajeFinal}</td>
                  <td>{producto.idVehiculo || "-"}</td>
                  <td>{producto.stockActual}</td>
                  <td>{producto.precioUnitario}</td>
                  <td>
                    <ActionButtons
                      onView={() => {
                        setProductoSeleccionado(producto);
                        setDetalleOpen(true);
                      }}
                      onEdit={() => abrirModal(producto)}
                      onDelete={() => {
                        setProductoSeleccionado(producto);
                        setConfirmDelete(true);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {modo === "kardex" && (
          <div className="tableWrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Movimiento</th>
                <th>Repuesto</th>
                <th>Cantidad</th>
                <th>Orden Servicio</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {kardex.map((item) => (
                <tr key={item.idMovimiento}>
                  <td>{new Date(item.fecha).toLocaleString()}</td>
                  <td>{item.tipoMovimiento}</td>
                  <td>{item.nombreRepuesto}</td>
                  <td>{item.cantidad}</td>
                  <td>{item.idOrdenServicio || "-"}</td>
                  <td>{item.idUsuario || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <DetailModal
        open={detalleOpen}
        title="Información del producto"
        onClose={() => setDetalleOpen(false)}
      >
        <ProductoDetail producto={productoSeleccionado} />
      </DetailModal>

      <InventarioModal
        open={modalOpen}
        modo={modo}
        productoEditar={productoModal}
        onClose={cerrarModal}
        onSave={guardarProducto}
      />

      <ConfirmModal
        open={confirmDelete}
        title="Eliminar registro"
        message="¿Seguro que deseas eliminar este registro?"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => eliminar(productoSeleccionado)}
      />
    </>
  );
}
