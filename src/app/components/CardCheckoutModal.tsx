"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  ShieldCheck,
} from "lucide-react";


interface Props {
  open: boolean;
  onClose: () => void;
}


export default function CardCheckoutModal({
  open,
  onClose
}: Props) {


const [card,setCard] = useState("");
const [name,setName] = useState("");
const [expiry,setExpiry] = useState("");
const [cvv,setCvv] = useState("");



function brand(){

const n = card.replace(/\D/g,"");

if(n.startsWith("4"))
return "VISA";

if(n.startsWith("5"))
return "MASTERCARD";

if(n.startsWith("3"))
return "AMEX";

return "CARD";

}




function maskCard(value:string){

return value
.replace(/\D/g,"")
.slice(0,16)
.replace(/(\d{4})(?=\d)/g,"$1 ");

}



function maskDate(value:string){

return value
.replace(/\D/g,"")
.slice(0,4)
.replace(/(\d{2})(\d)/,"$1/$2");

}



return (

<AnimatePresence>

{
open && (

<motion.div

initial={{
opacity:0
}}

animate={{
opacity:1
}}

exit={{
opacity:0
}}

className="
fixed
inset-0
z-[999]
flex
items-center
justify-center
bg-black/60
px-4
backdrop-blur-md
"


onClick={onClose}

>



<motion.div

initial={{
scale:0.85,
opacity:0,
y:40
}}

animate={{
scale:1,
opacity:1,
y:0
}}

exit={{
scale:0.85,
opacity:0,
y:40
}}

transition={{
duration:.25,
ease:"easeOut"
}}


onClick={(e)=>e.stopPropagation()}


className="
relative
w-full
max-w-md
rounded-[32px]
bg-white
p-6
shadow-2xl
"


>


{/* FECHAR */}

<button

onClick={onClose}

className="
absolute
right-5
top-5
flex
h-10
w-10
items-center
justify-center
rounded-full
bg-gray-100
text-gray-600
transition
hover:bg-gray-200
"

>

<X size={20}/>

</button>





<h2 className="
mb-6
text-center
text-xl
font-bold
text-gray-900
">

Pagamento com Cartão

</h2>






{/* CARTÃO */}

<div

className="
relative
h-52
rounded-3xl
bg-gradient-to-br
from-indigo-600
via-purple-600
to-fuchsia-500
p-6
text-white
shadow-xl
"

>


<div className="
flex
justify-between
">

<div className="
h-7
w-10
rounded-md
bg-yellow-200
"/>


<span className="
font-black
text-xl
">

{brand()}

</span>


</div>



<p className="
mt-12
text-2xl
tracking-[3px]
">

{
card || 
"4325 2398 2934 8239"
}

</p>



<div className="
absolute
bottom-6
left-6
right-6
flex
justify-between
">


<div>

<p className="
text-xs
opacity-70
">

NOME

</p>

<p className="
font-semibold
">

{
name || "HUMBERTO SANTOS"
}

</p>


</div>



<div>

<p className="
text-xs
opacity-70
">

VALIDADE

</p>

<p className="
font-semibold
">

{
expiry || "12/29"
}

</p>


</div>


</div>


</div>







<div className="mt-6 space-y-4">


<div>

<label className="
text-sm
font-semibold
">

Número do cartão

</label>


<input

value={card}

onChange={(e)=>
setCard(maskCard(e.target.value))
}

placeholder="4325 2398 2934 8239"

className="
mt-2
h-12
w-full
rounded-xl
border
px-4
outline-none
transition
focus:border-teal-600
focus:ring-2
focus:ring-teal-100
"

/>


</div>




<div>

<label className="
text-sm
font-semibold
">

Nome no cartão

</label>


<input

value={name}

onChange={(e)=>
setName(e.target.value.toUpperCase())
}

placeholder="HUMBERTO SANTOS"

className="
mt-2
h-12
w-full
rounded-xl
border
px-4
uppercase
outline-none
focus:border-teal-600
"

/>


</div>





<div className="
grid
grid-cols-2
gap-4
">


<div>

<label className="text-sm font-semibold">
Validade
</label>


<input

value={expiry}

onChange={(e)=>
setExpiry(maskDate(e.target.value))
}

placeholder="12/29"

className="
mt-2
h-12
w-full
rounded-xl
border
px-4
"

/>

</div>




<div>

<label className="text-sm font-semibold">
CVC
</label>


<input

type="password"

value={cvv}

onChange={(e)=>
setCvv(
e.target.value
.replace(/\D/g,"")
.slice(0,4)
)
}

placeholder="123"

className="
mt-2
h-12
w-full
rounded-xl
border
px-4
"

/>

</div>


</div>


</div>






<div className="
mt-5
rounded-2xl
bg-gray-50
p-4
text-sm
">


<div className="
flex
items-center
gap-2
">

<ShieldCheck
size={18}
className="text-green-600"
/>

Pagamento protegido

</div>


<div className="
mt-2
flex
items-center
gap-2
">

<Lock size={18}/>

Dados criptografados

</div>


</div>







<button

className="
mt-5
h-14
w-full
rounded-2xl
bg-[#009688]
font-bold
text-white
transition
hover:bg-[#00796b]
active:scale-95
cursor-pointer+
"

>

Pagar R$ 59,99

</button>



</motion.div>


</motion.div>

)

}

</AnimatePresence>

)

}