import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { db } from "../../lib/db";
import { toPositiveInt } from "../../lib/session";
import { authCookieOptions } from "../../lib/authCookies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * =========================================================
 * LIMPA JWT_SECRET
 * =========================================================
 */
function cleanSecret(value?: string): string {
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
        return cleaned.slice(1, -1);
    }

    return cleaned;
}

/**
 * =========================================================
 * STRING SEGURA
 * =========================================================
 */
function toSafeString(
    value: unknown
): string | null {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const valueString =
        String(value).trim();

    return valueString || null;
}

/**
 * =========================================================
 * VERIFICA UUID
 * =========================================================
 */
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

/**
 * =========================================================
 * TIPO DO JWT
 * =========================================================
 */
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

/**
 * =========================================================
 * PROCURA UUID RELACIONADO AO USER ID
 * =========================================================
 *
 * Exemplo:
 *
 * users
 * id = 6
 *
 * customers
 * id = 114bad0d-f503-4bee-b898-62537c2ae723
 * user_id = 6
 *
 * Resultado:
 *
 * usuario_id =
 * 114bad0d-f503-4bee-b898-62537c2ae723
 *
 * =========================================================
 */
async function encontrarUsuarioUuid(
    userId: number
): Promise<string | null> {
    try {
        /**
         * -----------------------------------------------------
         * 1. PROCURA CAMPOS UUID NA PRÓPRIA TABELA USERS
         * -----------------------------------------------------
         */

        const [userColumns]: any =
            await db.query(`
                SELECT
                    COLUMN_NAME,
                    DATA_TYPE,
                    CHARACTER_MAXIMUM_LENGTH
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'users'
            `);

        if (
            Array.isArray(
                userColumns
            )
        ) {
            const possibleColumns =
                userColumns
                    .filter(
                        (column: any) => {
                            const name =
                                String(
                                    column.COLUMN_NAME ||
                                        ""
                                ).toLowerCase();

                            const type =
                                String(
                                    column.DATA_TYPE ||
                                        ""
                                ).toLowerCase();

                            const length =
                                Number(
                                    column.CHARACTER_MAXIMUM_LENGTH ||
                                        0
                                );

                            const looksLikeUuid =
                                name === "uuid" ||
                                name ===
                                    "user_uuid" ||
                                name ===
                                    "usuario_uuid" ||
                                name ===
                                    "user_id_uuid" ||
                                name ===
                                    "usuario_id";

                            const looksLikeString =
                                type ===
                                    "char" ||
                                type ===
                                    "varchar";

                            return (
                                looksLikeUuid &&
                                looksLikeString &&
                                length >= 36
                            );
                        }
                    )
                    .map(
                        (column: any) =>
                            column.COLUMN_NAME
                    );

            for (
                const columnName of possibleColumns
            ) {
                const safeColumn =
                    String(
                        columnName
                    ).replace(
                        /`/g,
                        ""
                    );

                const [result]: any =
                    await db.query(
                        `
                        SELECT
                            \`${safeColumn}\` AS uuid
                        FROM users
                        WHERE id = ?
                        LIMIT 1
                        `,
                        [
                            userId,
                        ]
                    );

                if (
                    Array.isArray(
                        result
                    ) &&
                    result.length
                ) {
                    const uuid =
                        toSafeString(
                            result[0]
                                ?.uuid
                        );

                    if (
                        uuid &&
                        isUuid(uuid)
                    ) {
                        console.log(
                            "🆔 UUID encontrado na tabela users:",
                            uuid
                        );

                        return uuid;
                    }
                }
            }
        }

        /**
         * -----------------------------------------------------
         * 2. PROCURA TABELAS RELACIONADAS
         * -----------------------------------------------------
         *
         * Procuramos tabelas que tenham:
         *
         * id
         * +
         * user_id
         *
         * ou
         *
         * id
         * +
         * usuario_id
         *
         * -----------------------------------------------------
         */

        const [
            relatedTables,
        ]: any =
            await db.query(`
                SELECT
                    c1.TABLE_NAME,
                    c1.COLUMN_NAME AS ID_COLUMN,
                    c1.DATA_TYPE AS ID_DATA_TYPE,
                    c1.CHARACTER_MAXIMUM_LENGTH AS ID_LENGTH,
                    c2.COLUMN_NAME AS USER_COLUMN
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
                        WHEN LOWER(c1.TABLE_NAME) LIKE '%profile%' THEN 3
                        WHEN LOWER(c1.TABLE_NAME) LIKE '%usuario%' THEN 4
                        ELSE 5
                    END
            `);

        if (
            Array.isArray(
                relatedTables
            )
        ) {
            for (
                const table of relatedTables
            ) {
                const tableName =
                    String(
                        table.TABLE_NAME
                    ).replace(
                        /`/g,
                        ""
                    );

                const idColumn =
                    String(
                        table.ID_COLUMN
                    ).replace(
                        /`/g,
                        ""
                    );

                const userColumn =
                    String(
                        table.USER_COLUMN
                    ).replace(
                        /`/g,
                        ""
                    );

                try {
                    const [result]: any =
                        await db.query(
                            `
                            SELECT
                                \`${idColumn}\` AS uuid
                            FROM \`${tableName}\`
                            WHERE \`${userColumn}\` = ?
                            LIMIT 1
                            `,
                            [
                                userId,
                            ]
                        );

                    if (
                        Array.isArray(
                            result
                        ) &&
                        result.length
                    ) {
                        const uuid =
                            toSafeString(
                                result[0]
                                    ?.uuid
                            );

                        if (
                            uuid &&
                            isUuid(uuid)
                        ) {
                            console.log(
                                "🆔 UUID encontrado:",
                                {
                                    tabela:
                                        tableName,
                                    coluna:
                                        idColumn,
                                    relacionamento:
                                        userColumn,
                                    userId,
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

        console.warn(
            "⚠️ Nenhum UUID relacionado encontrado para users.id:",
            userId
        );

        return null;
    } catch (error) {
        console.error(
            "❌ Erro procurando UUID do usuário:",
            error
        );

        return null;
    }
}

/**
 * =========================================================
 * GET /api/me
 * =========================================================
 */
export async function GET() {
    try {
        console.log("");
        console.log(
            "=============================================="
        );
        console.log(
            "👤 GET /api/me"
        );
        console.log(
            "=============================================="
        );

        /**
         * =====================================================
         * COOKIE
         * =====================================================
         */

        const cookieStore =
            await cookies();

        const token =
            cookieStore.get(
                "access_token"
            )?.value;

        if (!token) {
            console.log(
                "❌ access_token não encontrado."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Não autenticado",
                },
                {
                    status: 401,
                    headers: {
                        "Cache-Control":
                            "no-store",
                    },
                }
            );
        }

        /**
         * =====================================================
         * JWT SECRET
         * =====================================================
         */

        const jwtSecret =
            cleanSecret(
                process.env.JWT_SECRET
            );

        if (!jwtSecret) {
            console.error(
                "❌ JWT_SECRET não configurada."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "JWT_SECRET não configurada",
                },
                {
                    status: 500,
                }
            );
        }

        /**
         * =====================================================
         * DECODIFICA JWT
         * =====================================================
         */

        let decoded:
            JwtPayloadCustom;

        try {
            decoded =
                jwt.verify(
                    token,
                    jwtSecret
                ) as JwtPayloadCustom;

            console.log(
                "🔐 JWT /api/me:",
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
        } catch (error) {
            console.error(
                "❌ Token inválido ou expirado:",
                error
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Token inválido ou expirado",
                },
                {
                    status: 401,
                    headers: {
                        "Cache-Control":
                            "no-store",
                    },
                }
            );
        }

        /**
         * =====================================================
         * ID NUMÉRICO DO USUÁRIO
         * =====================================================
         */

        const tokenUserId =
            toPositiveInt(
                decoded.id
            ) ??
            toPositiveInt(
                decoded.userId
            ) ??
            toPositiveInt(
                decoded.user_id
            ) ??
            toPositiveInt(
                decoded.sub
            );

        /**
         * =====================================================
         * POSSÍVEL UUID DO JWT
         * =====================================================
         */

        let tokenUsuarioId:
            string | null = null;

        const jwtUuidCandidates = [
            decoded.usuario_id,
            decoded.userId,
            decoded.user_id,
            decoded.sub,
        ];

        for (
            const candidate of
                jwtUuidCandidates
        ) {
            const value =
                toSafeString(
                    candidate
                );

            if (
                value &&
                isUuid(value)
            ) {
                tokenUsuarioId =
                    value;

                break;
            }
        }

        /**
         * =====================================================
         * E-MAIL
         * =====================================================
         */

        const tokenEmail =
            typeof decoded.email ===
            "string"
                ? decoded.email
                      .trim()
                      .toLowerCase()
                : "";

        /**
         * =====================================================
         * PRECISA TER ID OU EMAIL
         * =====================================================
         */

        if (
            !tokenUserId &&
            !tokenEmail
        ) {
            console.error(
                "❌ JWT não possui ID nem e-mail."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Token inválido",
                },
                {
                    status: 401,
                }
            );
        }

        /**
         * =====================================================
         * BUSCA USUÁRIO
         * =====================================================
         */

        let rows: any[] = [];

        try {
            /**
             * -------------------------------------------------
             * POR ID
             * -------------------------------------------------
             */

            if (tokenUserId) {
                console.log(
                    "🔎 Procurando usuário pelo ID:",
                    tokenUserId
                );

                const [byId]: any =
                    await db.query(
                        `
                        SELECT
                            id,
                            full_name,
                            phone,
                            email,
                            user_type,
                            profile_image,
                            identification_number,
                            identification_type,
                            phone_verified_at,
                            email_verified_at
                        FROM users
                        WHERE id = ?
                        LIMIT 1
                        `,
                        [
                            tokenUserId,
                        ]
                    );

                if (
                    Array.isArray(
                        byId
                    )
                ) {
                    rows = byId;
                }
            }

            /**
             * -------------------------------------------------
             * POR E-MAIL
             * -------------------------------------------------
             */

            if (
                !rows.length &&
                tokenEmail
            ) {
                console.log(
                    "🔎 Procurando usuário pelo e-mail:",
                    tokenEmail
                );

                const [
                    byEmail,
                ]: any =
                    await db.query(
                        `
                        SELECT
                            id,
                            full_name,
                            phone,
                            email,
                            user_type,
                            profile_image,
                            identification_number,
                            identification_type,
                            phone_verified_at,
                            email_verified_at
                        FROM users
                        WHERE LOWER(email) = LOWER(?)
                        LIMIT 1
                        `,
                        [
                            tokenEmail,
                        ]
                    );

                if (
                    Array.isArray(
                        byEmail
                    )
                ) {
                    rows =
                        byEmail;
                }
            }
        } catch (
            dbError: any
        ) {
            console.error(
                "❌ /api/me database error:",
                dbError
            );

            const code =
                String(
                    dbError?.code ||
                        ""
                );

            let message =
                "Erro ao carregar usuário no banco de dados.";

            if (
                code ===
                    "ER_ACCESS_DENIED_ERROR" ||
                code ===
                    "ECONNREFUSED"
            ) {
                message =
                    "Falha na conexão com o banco. Verifique DB_HOST/DB_USER/DB_PASSWORD no .env.";
            }

            return NextResponse.json(
                {
                    success: false,
                    message,
                },
                {
                    status: 500,
                }
            );
        }

        /**
         * =====================================================
         * USUÁRIO NÃO ENCONTRADO
         * =====================================================
         */

        if (!rows.length) {
            console.error(
                "❌ Usuário não encontrado."
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Usuário não encontrado neste banco. Faça login novamente.",
                },
                {
                    status: 401,
                    headers: {
                        "Cache-Control":
                            "no-store",
                    },
                }
            );
        }

        /**
         * =====================================================
         * USUÁRIO
         * =====================================================
         */

        const user = rows[0];

        const resolvedId =
            toPositiveInt(
                user.id
            );

        if (!resolvedId) {
            console.error(
                "❌ ID do usuário inválido:",
                user.id
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "ID do usuário inválido no banco.",
                },
                {
                    status: 500,
                }
            );
        }

        /**
         * =====================================================
         * ENCONTRA UUID
         * =====================================================
         */

        let resolvedUsuarioId =
            tokenUsuarioId;

        if (
            !resolvedUsuarioId
        ) {
            resolvedUsuarioId =
                await encontrarUsuarioUuid(
                    resolvedId
                );
        }

        console.log(
            "=============================================="
        );

        console.log(
            "✅ USUÁRIO RESOLVIDO"
        );

        console.log({
            id:
                resolvedId,

            usuario_id:
                resolvedUsuarioId,

            email:
                user.email,

            user_type:
                user.user_type,
        });

        console.log(
            "=============================================="
        );

        /**
         * =====================================================
         * NOVO JWT
         * =====================================================
         */

        const newToken =
            jwt.sign(
                {
                    /**
                     * Mantém o ID numérico
                     * para compatibilidade.
                     */
                    id:
                        resolvedId,

                    /**
                     * UUID correto.
                     */
                    usuario_id:
                        resolvedUsuarioId,

                    /**
                     * Aliases.
                     */
                    userId:
                        resolvedUsuarioId,

                    user_id:
                        resolvedUsuarioId,

                    user_type:
                        user.user_type ??
                        null,

                    email:
                        user.email ??
                        null,
                },

                jwtSecret,

                {
                    expiresIn:
                        "10d",
                }
            );

        /**
         * =====================================================
         * RESPOSTA
         * =====================================================
         */

        const response =
            NextResponse.json(
                {
                    success: true,

                    /**
                     * ID interno da tabela users.
                     * Exemplo: 6
                     */
                    id:
                        resolvedId,

                    /**
                     * UUID para relacionamentos
                     * externos/protocolos.
                     */
                    usuario_id:
                        resolvedUsuarioId,

                    userId:
                        resolvedUsuarioId,

                    user_id:
                        resolvedUsuarioId,

                    full_name:
                        user.full_name,

                    phone:
                        user.phone,

                    email:
                        user.email,

                    profile_image:
                        user.profile_image,

                    identification_number:
                        user.identification_number,

                    identification_type:
                        user.identification_type,

                    phone_verified_at:
                        user.phone_verified_at,

                    email_verified_at:
                        user.email_verified_at,

                    user_type:
                        user.user_type,
                },
                {
                    status: 200,
                }
            );

        /**
         * =====================================================
         * ATUALIZA COOKIE
         * =====================================================
         */

        response.cookies.set(
            "access_token",
            newToken,
            authCookieOptions(
                60 * 60 * 24 * 10
            )
        );

        /**
         * =====================================================
         * CACHE
         * =====================================================
         */

        response.headers.set(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
        );

        response.headers.set(
            "Pragma",
            "no-cache"
        );

        response.headers.set(
            "Expires",
            "0"
        );

        console.log(
            "✅ /api/me → 200"
        );

        return response;
    } catch (error: any) {
        console.error(
            "❌ /api/me error:",
            error
        );

        return NextResponse.json(
            {
                success: false,

                message:
                    "Erro interno",

                ...(process.env.NODE_ENV ===
                "development"
                    ? {
                          error:
                              error?.message,
                      }
                    : {}),
            },
            {
                status: 500,

                headers: {
                    "Cache-Control":
                        "no-store",
                },
            }
        );
    }
}