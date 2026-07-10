import "./DataField.css";

export default function DataField({

    label,

    value

}){

    return(

        <div className="dataField">

            <span>

                {label}

            </span>

            <strong>

                {value}

            </strong>

        </div>

    )

}