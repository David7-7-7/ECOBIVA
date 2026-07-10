import "./PageHeader.css";

export default function PageHeader({

    title,

    subtitle,

    button,

    actions

}){

    return(

        <div className="pageHeader">

            <div>

                <h1>{title}</h1>

                <p>{subtitle}</p>

            </div>

            <div className="pageHeaderActions">

                {actions}

                {button}

            </div>

        </div>

    )

}