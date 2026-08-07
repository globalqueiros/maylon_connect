import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "../../../lib/db";

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Não autenticado." },
                { status: 401 }
            );
        }

        let decoded: { id: string };

        try {
            decoded = jwt.verify(
                token,
                process.env.JWT_SECRET!
            ) as { id: string };
        } catch {
            return NextResponse.json(
                { error: "Token inválido ou expirado." },
                { status: 401 }
            );
        }

        const { id } = await req.json();

        if (!id) {
            return NextResponse.json(
                { error: "ID da sessão não informado." },
                { status: 400 }
            );
        }

        const [result]: any = await db.query(
            `
            DELETE FROM sessions
            WHERE id = ?
              AND user_id = ?
            `,
            [id, decoded.id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: "Sessão não encontrada." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Sessão encerrada com sucesso.",
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Erro interno do servidor." },
            { status: 500 }
        );
    }
}
