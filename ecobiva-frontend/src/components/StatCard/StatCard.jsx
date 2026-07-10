import "./StatCard.css";

export default function StatCard({

    title,

    value,

    icon,

    color="#2563eb"

}){

    return(

        <div className="statCard">

            <div>

                <p>

                    {title}

                </p>

                <h2>

                    {value}

                </h2>

            </div>

            <div

                className="statIcon"

                style={{

                    background:color

                }}

            >

                {icon}

            </div>

        </div>

    )

}