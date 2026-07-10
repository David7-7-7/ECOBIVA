import "./DetailModal.css";

import { FaTimes } from "react-icons/fa";

export default function DetailModal({

    open,
    title,
    children,
    onClose

}){

    if(!open) return null;

    return(

        <div className="detailOverlay">

            <div className="detailModal">

                <div className="detailHeader">

                    <h2>{title}</h2>

                    <button
                        onClick={onClose}
                    >
                        <FaTimes/>
                    </button>

                </div>

                <div className="detailBody">

                    {children}

                </div>

            </div>

        </div>

    )

}