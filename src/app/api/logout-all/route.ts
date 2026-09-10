import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

export async function POST() {
    try {
        const cookieStore = cookies();

        const token = (await cookieStore).get("access_token")?.value;

        if (!token) {
            return NextResponse.json({ message: "Sem token" }, { status: 401 });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        const userId = decoded.id;

        await db.query("DELETE FROM sessions WHERE user_id = ?", [userId]);

        const res = NextResponse.json({ success: true });

        res.cookies.set("access_token", "", { path: "/", maxAge: 0 });
        res.cookies.set("refresh_token", "", { path: "/", maxAge: 0 });

        return res;

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Erro interno" }, { status: 500 });
    }
}