import "./Input.css";

export default function Input({

label,

placeholder,

type="text",

required=false,

value,

onChange,

error

}){

return(

<div className="inputGroup">

<label>

{label}

{

required &&

<span>

 *

</span>

}

</label>

<input

type={type}

placeholder={placeholder}

value={value}

onChange={onChange}

/>

{

error &&

<p className="inputError">

{error}

</p>

}

</div>

)

}