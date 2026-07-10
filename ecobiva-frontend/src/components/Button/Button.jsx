import "./Button.css";

export default function Button({

    children,

    type = "button",

    variant = "primary",

    onClick,

    disabled = false

}) {

    return (

        <button

            type={type}

            onClick={onClick}

            disabled={disabled}

            className={`btn btn-${variant}`}

        >

            {children}

        </button>

    );

}