import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const tripId = String(id ?? "").trim();

        console.log("=================================");
        console.log("BUSCAR VIAGEM");
        console.log("ID:", tripId);
        console.log("=================================");

        if (!tripId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "ID da viagem não informado.",
                },
                { status: 400 }
            );
        }

        /*
         * O ID da URL é UUID.
         *
         * Exemplo:
         * 8e591cb9-73db-4e30-be52-87d22fd672ca
         *
         * Portanto NÃO usamos Number(id).
         */

        const [rows] = await db.query(
            `
            SELECT *
            FROM trips
            WHERE id = ?
            LIMIT 1
            `,
            [tripId]
        );

        const viagens = rows as any[];

        console.log(
            "Quantidade encontrada:",
            viagens.length
        );

        if (!viagens.length) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Viagem não encontrada.",
                },
                { status: 404 }
            );
        }

        const viagem = viagens[0];

        console.log(
            "Viagem encontrada:",
            viagem
        );

        const pegar = (
            campos: string[],
            padrao: any = null
        ) => {
            for (const campo of campos) {
                if (
                    Object.prototype.hasOwnProperty.call(
                        viagem,
                        campo
                    ) &&
                    viagem[campo] !== null &&
                    viagem[campo] !== undefined &&
                    viagem[campo] !== ""
                ) {
                    return viagem[campo];
                }
            }

            return padrao;
        };

        const trip = {
            id: pegar(
                ["id"],
                tripId
            ),

            trip_request_id: String(
                pegar(
                    [
                        "trip_request_id",
                        "request_id",
                        "trip_id",
                        "id",
                    ],
                    tripId
                )
            ),

            pickup_address: String(
                pegar(
                    [
                        "pickup_address",
                        "origin",
                        "pickup_location",
                        "origem",
                        "endereco_origem",
                    ],
                    "Origem não informada"
                )
            ),

            destination_address: String(
                pegar(
                    [
                        "destination_address",
                        "destination",
                        "dropoff_address",
                        "dropoff_location",
                        "destino",
                        "endereco_destino",
                    ],
                    "Destino não informado"
                )
            ),

            valor: Number(
                pegar(
                    [
                        "valor",
                        "fare",
                        "amount",
                        "price",
                        "preco",
                        "valor_corrida",
                    ],
                    0
                )
            ),

            current_status: String(
                pegar(
                    [
                        "current_status",
                        "status",
                        "trip_status",
                        "situacao",
                    ],
                    "pending"
                )
            ),
        };

        return NextResponse.json(
            {
                success: true,
                trip,
            },
            {
                status: 200,
                headers: {
                    "Cache-Control":
                        "no-store, no-cache, must-revalidate",
                },
            }
        );
    } catch (error) {
        console.error(
            "================================="
        );

        console.error(
            "ERRO REAL AO BUSCAR VIAGEM:"
        );

        console.error(error);

        console.error(
            "================================="
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Erro interno ao buscar a viagem.",

                error:
                    process.env.NODE_ENV ===
                    "development"
                        ? error instanceof Error
                            ? error.message
                            : String(error)
                        : undefined,
            },
            {
                status: 500,
            }
        );
    }
}