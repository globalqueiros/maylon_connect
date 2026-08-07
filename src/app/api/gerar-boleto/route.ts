import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();

    const response = await fetch(
        "https://api.btgpactual.com/cobranca/v1/boletos",
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.BTG_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pagador: {
                    nome: body.nome,
                    cpfCnpj: body.cpf
                },
                valor: body.valor,
                vencimento: body.vencimento,
                descricao: body.descricao
            })
        }
    );

    cost data = await response.json();
 
    return NextResponse.json(data);
}