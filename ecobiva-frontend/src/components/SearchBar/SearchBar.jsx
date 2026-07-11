import "./SearchBar.css";
import { FaSearch } from "react-icons/fa";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Buscar...",
  width = "300px",
}) {
  return (
    <div className="searchBar" style={{ maxWidth: width }}>
      <FaSearch className="searchIcon" />

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
