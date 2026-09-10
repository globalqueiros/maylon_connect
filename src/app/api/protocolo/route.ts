import { NextResponse } from "next/server";
import { db } from "../../lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { toPositiveInt } from "../../lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =========================================================
   DATA / HORA DE SÃO PAULO
========================================================= */

function getDataSP() {
    const data = new Date();

    const sp = new Date(
        data.toLocaleString("en-US", {
            timeZone: "America/Sao_Paulo",
        })
    );

    const yyyy = sp.getFullYear();

    const mm = String(
        sp.getMonth() + 1
    ).padStart(2, "0");

    const dd = String(
        sp.getDate()
    ).padStart(2, "0");

    const hh = String(
        sp.getHours()
    ).padStart(2, "0");

    const min = String(
        sp.getMinutes()
    ).padStart(2, "0");

    const ss = String(
        sp.getSeconds()
    ).padStart(2, "0");

    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

/* =========================================================
   LIMPA JWT SECRET
========================================================= */

function cleanSecret(
    value?: string
) {
    if (!value) {
        return "";
    }

    const cleaned = value
        .replace(/\r/g, "")
        .trim();

    if (
        (cleaned.startsWith('"') &&
            cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") &&
            cleaned.endsWith("'"))
    ) {
        return cleaned.slice(
            1,
            -1
        );
    }

    return cleaned;
}

/* =========================================================
   VERIFICA UUID
========================================================= */

function isUuid(
    value: unknown
): boolean {
    if (
        typeof value !== "string"
    ) {
        return false;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value.trim()
    );
}

/* =========================================================
   STRING SEGURA
========================================================= */

function safeString(
    value: unknown
): string {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}

/* =========================================================
   JWT
========================================================= */

type JwtPayloadCustom =
    jwt.JwtPayload & {
        id?: unknown;
        userId?: unknown;
        user_id?: unknown;
        usuario_id?: unknown;
        sub?: unknown;
        email?: unknown;
        user_type?: unknown;
    };

/* =========================================================
   PROCURA UUID DO USUÁRIO
========================================================= */

async function findUserUuid(
    numericUserId: number,
    email: string
): Promise<string | null> {
    try {
        console.log(
            "🔎 Procurando UUID relacionado ao usuário:",
            numericUserId
        );

        /* -------------------------------------------------
           PRIMEIRO:
           procura tabelas que tenham:

           id = UUID

           e

           user_id / usuario_id = 6
        ------------------------------------------------- */

        const [
            candidates,
        ]: any =
            await db.query(`
                SELECT
                    c1.TABLE_NAME AS table_name,
                    c1.COLUMN_NAME AS id_column,
                    c2.COLUMN_NAME AS user_column
                FROM INFORMATION_SCHEMA.COLUMNS c1
                INNER JOIN INFORMATION_SCHEMA.COLUMNS c2
                    ON c1.TABLE_SCHEMA = c2.TABLE_SCHEMA
                    AND c1.TABLE_NAME = c2.TABLE_NAME
                WHERE c1.TABLE_SCHEMA = DATABASE()
                  AND c1.COLUMN_NAME = 'id'
                  AND c2.COLUMN_NAME IN (
                      'user_id',
                      'usuario_id'
                  )
                  AND c1.DATA_TYPE IN (
                      'char',
                      'varchar'
                  )
                  AND c1.CHARACTER_MAXIMUM_LENGTH >= 36
                  AND c1.TABLE_NAME <> 'users'
                ORDER BY
                    CASE
                        WHEN LOWER(c1.TABLE_NAME) LIKE '%customer%' THEN 1
                        WHEN LOWER(c1.TABLE_NAME) LIKE '%cliente%' THEN 2
                        WHEN LOWER(c1.TABLE_NAME) LIKE '%usuario%' THEN 3
                        WHEN LOWER(c1.TABLE_NAME) LIKE '%profile%' THEN 4
                        ELSE 5
                    END
            `);

        if (
            Array.isArray(
                candidates
            )
        ) {
            for (
                const table of candidates
            ) {
                const tableName =
                    safeString(
                        table.table_name
                    );

                const idColumn =
                    safeString(
                        table.id_column
                    );

                const userColumn =
                    safeString(
                        table.user_column
                    );

                if (
                    !tableName ||
                    !idColumn ||
                    !userColumn
                ) {
                    continue;
                }

                try {
                    const [
                        rows,
                    ]: any =
                        await db.query(
                            `
                            SELECT
                                \`${idColumn}\` AS uuid
                            FROM \`${tableName}\`
                            WHERE \`${userColumn}\` = ?
                            LIMIT 1
                            `,
                            [
                                numericUserId,
                            ]
                        );

                    if (
                        Array.isArray(
                            rows
                        ) &&
                        rows.length
                    ) {
                        const uuid =
                            safeString(
                                rows[0]?.uuid
                            );

                        if (
                            isUuid(
                                uuid
                            )
                        ) {
                            console.log(
                                "✅ UUID encontrado:",
                                {
                                    tabela:
                                        tableName,
                                    coluna:
                                        idColumn,
                                    relacionamento:
                                        userColumn,
                                    user_id:
                                        numericUserId,
                                    uuid,
                                }
                            );

                            return uuid;
                        }
                    }
                } catch (
                    tableError
                ) {
                    console.warn(
                        `⚠️ Não foi possível consultar ${tableName}:`,
                        tableError
                    );
                }
            }
        }

        /* -------------------------------------------------
           SEGUNDO:
           procura uma tabela que tenha:

           id = UUID
           email = e-mail do usuário
        ------------------------------------------------- */

        if (email) {
            console.log(
                "🔎 Procurando UUID pelo e-mail:",
                email
            );

            const [
                emailCandidates,
            ]: any =
                await db.query(`
                    SELECT
                        c1.TABLE_NAME AS table_name,
                        c1.COLUMN_NAME AS id_column,
                        c2.COLUMN_NAME AS email_column
                    FROM INFORMATION_SCHEMA.COLUMNS c1
                    INNER JOIN INFORMATION_SCHEMA.COLUMNS c2
                        ON c1.TABLE_SCHEMA = c2.TABLE_SCHEMA
                        AND c1.TABLE_NAME = c2.TABLE_NAME
                    WHERE c1.TABLE_SCHEMA = DATABASE()
                      AND c1.COLUMN_NAME = 'id'
                      AND c2.COLUMN_NAME IN (
                          'email',
                          'email_address'
                      )
                      AND c1.DATA_TYPE IN (
                          'char',
                          'varchar'
                      )
                      AND c1.CHARACTER_MAXIMUM_LENGTH >= 36
                      AND c1.TABLE_NAME <> 'users'
                `);

            if (
                Array.isArray(
                    emailCandidates
                )
            ) {
                for (
                    const table of emailCandidates
                ) {
                    const tableName =
                        safeString(
                            table.table_name
                        );

                    const idColumn =
                        safeString(
                            table.id_column
                        );

                    const emailColumn =
                        safeString(
                            table.email_column
                        );

                    if (
                        !tableName ||
                        !idColumn ||
                        !emailColumn
                    ) {
                        continue;
                    }

                    try {
                        const [
                            rows,
                        ]: any =
                            await db.query(
                                `
                                SELECT
                                    \`${idColumn}\` AS uuid
                                FROM \`${tableName}\`
                                WHERE LOWER(\`${emailColumn}\`) = LOWER(?)
                                LIMIT 1
                                `,
                                [
                                    email,
                                ]
                            );

                        if (
                            Array.isArray(
                                rows
                            ) &&
                            rows.length
                        ) {
                            const uuid =
                                safeString(
                                    rows[0]?.uuid
                                );

                            if (
                                isUuid(
                                    uuid
                                )
                            ) {
                                console.log(
                                    "✅ UUID encontrado pelo e-mail:",
                                    {
                                        tabela:
                                            tableName,
                                        uuid,
                                    }
                                );

                                return uuid;
                            }
                        }
                    } catch (
                        tableError
                    ) {
                        console.warn(
                            `⚠️ Erro consultando ${tableName}:`,
                            tableError
                        );
                    }
                }
            }
        }

        console.error(
            "❌ Não foi encontrado UUID para o usuário:",
            numericUserId
        );

        return null;
    } catch (error) {
        console.error(
            "❌ Erro ao procurar UUID:",
            error
        );

        return null;
    }
}

/* =========================================================
   USUÁRIO AUTENTICADO
========================================================= */

async function getUserFromToken() {
    try {
        const cookieStore =
            await cookies();

        const token =
            cookieStore.get(
                "access_token"
            )?.value;

        if (!token) {
            console.error(
                "❌ access_token não encontrado."
            );

            return null;
        }

        const jwtSecret =
            cleanSecret(
                process.env.JWT_SECRET
            );

        if (!jwtSecret) {
            console.error(
                "❌ JWT_SECRET não configurada."
            );

            return null;
        }

        let decoded:
            JwtPayloadCustom;

        try {
            decoded =
                jwt.verify(
                    token,
                    jwtSecret
                ) as JwtPayloadCustom;
        } catch (error) {
            console.error(
                "❌ JWT inválido ou expirado:",
                error
            );

            return null;
        }

        console.log(
            "🔐 JWT /api/protocolo:",
            {
                id:
                    decoded.id ??
                    null,

                userId:
                    decoded.userId ??
                    null,

                user_id:
                    decoded.user_id ??
                    null,

                usuario_id:
                    decoded.usuario_id ??
                    null,

                sub:
                    decoded.sub ??
                    null,

                email:
                    decoded.email ??
                    null,

                user_type:
                    decoded.user_type ??
                    null,
            }
        );

        /* -------------------------------------------------
           SE O JWT JÁ TIVER UUID
        ------------------------------------------------- */

        const uuidCandidates = [
            decoded.usuario_id,
            decoded.userId,
            decoded.user_id,
            decoded.sub,
        ];

        for (
            const candidate of
                uuidCandidates
        ) {
            const value =
                safeString(
                    candidate
                );

            if (
                isUuid(value)
            ) {
                console.log(
                    "✅ UUID encontrado diretamente no JWT:",
                    value
                );

                return {
                    id:
                        toPositiveInt(
                            decoded.id
                        ),

                    usuario_id:
                        value,

                    email:
                        typeof decoded.email ===
                        "string"
                            ? decoded.email
                                  .trim()
                                  .toLowerCase()
                            : "",
                };
            }
        }

        /* -------------------------------------------------
           PEGA ID NUMÉRICO
        ------------------------------------------------- */

        const numericUserId =
            toPositiveInt(
                decoded.id
            ) ??
            toPositiveInt(
                decoded.userId
            ) ??
            toPositiveInt(
                decoded.user_id
            );

        const email =
            typeof decoded.email ===
            "string"
                ? decoded.email
                      .trim()
                      .toLowerCase()
                : "";

        if (
            !numericUserId
        ) {
            console.error(
                "❌ Nenhum ID válido encontrado no JWT."
            );

            return null;
        }

        /* -------------------------------------------------
           PROCURA UUID
        ------------------------------------------------- */

        const uuid =
            await findUserUuid(
                numericUserId,
                email
            );

        if (!uuid) {
            console.error(
                "❌ Não foi possível encontrar o UUID do usuário."
            );

            return null;
        }

        console.log(
            "✅ Usuário autenticado:",
            {
                id:
                    numericUserId,

                usuario_id:
                    uuid,

                email,
            }
        );

        return {
            id:
                numericUserId,

            usuario_id:
                uuid,

            email,
        };
    } catch (error) {
        console.error(
            "❌ Erro getUserFromToken:",
            error
        );

        return null;
    }
}

/* =========================================================
   POST /api/protocolo
========================================================= */

export async function POST(
    req: Request
) {
    try {
        const user =
            await getUserFromToken();

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Não foi possível identificar o usuário. Faça login novamente.",
                },
                {
                    status: 401,
                }
            );
        }

        let body:
            Record<
                string,
                unknown
            > = {};

        try {
            body =
                (await req.json()) ||
                {};
        } catch {
            body = {};
        }

        const nome =
            safeString(
                body.nome
            );

        const email =
            safeString(
                body.email
            );

        const categoria =
            safeString(
                body.categoria
            );

        const assunto =
            safeString(
                body.assunto
            );

        const mensagem =
            safeString(
                body.mensagem
            );

        const codigoFinal =
            safeString(
                body.codigo
            ) ||
            `PRT-${Date.now()}`;

        const documentoUrl =
            safeString(
                body.documento_url
            ) || null;

        /* -------------------------------------------------
           VALIDAÇÃO
        ------------------------------------------------- */

        if (!assunto) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Informe o assunto.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!mensagem) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Informe a mensagem.",
                },
                {
                    status: 400,
                }
            );
        }

        /* -------------------------------------------------
           INSERT
        ------------------------------------------------- */

        console.log(
            "📨 Criando protocolo:",
            {
                codigo:
                    codigoFinal,

                usuario_id:
                    user.usuario_id,

                id:
                    user.id,

                email:
                    user.email,
            }
        );

        await db.query(
            `
            INSERT INTO protocolos
            (
                usuario_id,
                codigo,
                nome,
                email,
                assunto,
                mensagem,
                status,
                criado_em
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                user.usuario_id,
                codigoFinal,
                nome || null,
                email || null,
                assunto,
                mensagem,
                "Aberto",
                getDataSP(),
            ]
        );

        console.log(
            "✅ Protocolo salvo com UUID:",
            user.usuario_id
        );

        return NextResponse.json(
            {
                success: true,

                codigo:
                    codigoFinal,

                usuario_id:
                    user.usuario_id,

                criado_em:
                    getDataSP(),

                status:
                    "Aberto",
            },
            {
                status: 201,
            }
        );
    } catch (error: any) {
        console.error(
            "❌ /api/protocolo POST error:",
            error
        );

        if (
            error?.code ===
            "ER_DUP_ENTRY"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Este código de protocolo já existe.",
                },
                {
                    status: 409,
                }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    "Erro ao criar protocolo.",
            },
            {
                status: 500,
            }
        );
    }
}

/* =========================================================
   GET /api/protocolo
========================================================= */

export async function GET() {
    try {
        const user =
            await getUserFromToken();

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Não autenticado",
                },
                {
                    status: 401,
                }
            );
        }

        console.log(
            "📋 Buscando protocolos do UUID:",
            user.usuario_id
        );

        const [
            rows,
        ]: any =
            await db.query(
                `
                SELECT
                    id,
                    usuario_id,
                    codigo,
                    nome,
                    email,
                    assunto,
                    mensagem,
                    status,
                    criado_em,
                    atualizado_em
                FROM protocolos
                WHERE usuario_id = ?
                ORDER BY
                    criado_em DESC,
                    id DESC
                `,
                [
                    user.usuario_id,
                ]
            );

        console.log(
            "✅ Protocolos encontrados:",
            Array.isArray(rows)
                ? rows.length
                : 0
        );

        return NextResponse.json(
            Array.isArray(rows)
                ? rows
                : [],
            {
                status: 200,
                headers: {
                    "Cache-Control":
                        "no-store, no-cache, must-revalidate",
                    Pragma:
                        "no-cache",
                    Expires:
                        "0",
                },
            }
        );
    } catch (error: any) {
        console.error(
            "❌ /api/protocolo GET error:",
            error
        );

        if (
            error?.code ===
            "ER_NO_SUCH_TABLE"
        ) {
            return NextResponse.json(
                [],
                {
                    status: 200,
                    headers: {
                        "Cache-Control":
                            "no-store",
                    },
                }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    "Erro ao buscar protocolos",
            },
            {
                status: 500,
            }
        );
    }
}