import "./StatusBadge.css";

export default function StatusBadge({ status }) {

    const texto = status || "Sin estado";

    const normalize = texto.toLowerCase();

    let clase = "badgeDefault";

    if (normalize.includes("activo"))
        clase = "badgeActivo";

    else if (
        normalize.includes("inactivo") ||
        normalize.includes("cancel")
    )
        clase = "badgeInactivo";

    else if (
        normalize.includes("proceso") ||
        normalize.includes("taller") ||
        normalize.includes("pendiente")
    )
        clase = "badgeProceso";

    else if (
        normalize.includes("final") ||
        normalize.includes("termin")
    )
        clase = "badgeFinalizado";

    else if (
        normalize.includes("stock") ||
        normalize.includes("bajo")
    )
        clase = "badgeStock";

    else if (
        normalize.includes("agot")
    )
        clase = "badgeAgotado";

    return (

        <span className={`badge ${clase}`}>

            {texto}

        </span>

    );

}