import "./SearchBar.css";

import { FaSearch } from "react-icons/fa";

export default function SearchBar({

    placeholder,

    value,

    onChange

}){

    return(

        <div className="searchBar">

            <FaSearch className="searchIcon"/>

            <input

                type="text"

                placeholder={placeholder}

                value={value}

                onChange={onChange}

            />

        </div>

    )

}