import "./Inventario.css";

import MainLayout from "../../layouts/MainLayout";
import { useState } from "react";

import { FaPlus, FaSearch, FaFilter } from "react-icons/fa";
import PageHeader from "../../components/PageHeader/PageHeader";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import StatusBadge from "../../components/StatusBadge/StatusBadge";

import DetailModal from "../../components/DetailModal/DetailModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import ProductoDetail from "../../components/ProductoDetail/ProductoDetail";
import SearchBar from "../../components/SearchBar/SearchBar";

export default function Inventario() {
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const productos = [
    {
      codigo: "PRD-001",
      nombre: "Aceite 10W40",
      categoria: "Lubricantes",
      stock: 24,
      minimo: 10,
      precio: "$52.000",
      proveedor: "Mobil",
      estado: "Disponible",
    },

    {
      codigo: "PRD-002",
      nombre: "Filtro de Aceite",
      categoria: "Filtros",
      stock: 8,
      minimo: 10,
      precio: "$18.000",
      proveedor: "Bosch",
      estado: "Stock Bajo",
    },

    {
      codigo: "PRD-003",
      nombre: "Pastillas de Freno",
      categoria: "Frenos",
      stock: 0,
      minimo: 5,
      precio: "$145.000",
      proveedor: "Brembo",
      estado: "Agotado",
    },

    {
      codigo: "PRD-004",
      nombre: "Refrigerante",
      categoria: "Fluidos",
      stock: 15,
      minimo: 8,
      precio: "$34.000",
      proveedor: "Prestone",
      estado: "Disponible",
    },
  ];
  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle="Control de repuestos."
        button={
          <button className="btnNuevo">
            <FaPlus />
            Nuevo Producto
          </button>
        }
      />

      <div className="inventarioCard">
        <SearchBar
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {productos.map((producto, index) => (
              <tr key={index}>
                <td>{producto.codigo}</td>
                <td>{producto.nombre}</td>
                <td>{producto.categoria}</td>
                <td>{producto.stock}</td>
                <td>{producto.precio}</td>

                <td>
                  <StatusBadge status={producto.estado} />
                </td>

                <td>
                  <ActionButtons
                    onView={() => {
                      setProductoSeleccionado(producto);
                      setDetalleOpen(true);
                    }}
                    onEdit={() => console.log(producto)}
                    onDelete={() => setConfirmDelete(true)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DetailModal
        open={detalleOpen}
        title="Información del Producto"
        onClose={() => setDetalleOpen(false)}
      >
        <ProductoDetail producto={productoSeleccionado} />
      </DetailModal>

      <ConfirmModal
        open={confirmDelete}
        title="Eliminar Producto"
        message="¿Está seguro de eliminar este producto? Esta acción solamente es visual."
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          console.log("Eliminar");

          setConfirmDelete(false);
        }}
      />
    </>
  );
}
