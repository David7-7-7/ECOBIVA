import "./DataTable.css";

export default function DataTable({
  columns = [],
  data = [],
  renderCell,
  emptyMessage = "No hay registros disponibles.",
}) {
  return (
    <div className="tableContainer">
      <table className="dataTable">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={column.style}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="emptyTable">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={row.id || row.idUsuario || index}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {renderCell ? renderCell(row, column) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
