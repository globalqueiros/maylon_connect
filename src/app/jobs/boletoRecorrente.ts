import cron from "node-cron";
import{ db } from "../lib/db";

cron.schedule("0 1 * * *", async () => {
    console.log("Executando cobrança recorrente...");

    const [assinaturas]: any = await db.query(`
        SELECT *
        FROM assinaturas
        WHERE status = 'ativa'
        AND proxima_cobranca = CURDATE()
    `);

    for (const assinatura of assinaturas) {

        await fetch(
            `${process.env.APP_URL}/api/gerar-boleto`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome: assinatura.nome,
                    cpf: assinatura.cpf,
                    valor: assinatura.valor,
                    vencimento: assinatura.proxima_cobranca,
                    descricao: assinatura.descricao
                })
            }
        );

        await db.execute(`
            UPDATE assinaturas
            SET proxima_cobranca =
                DATE_ADD(proxima_cobranca, INTERVAL 1 MONTH)
            WHERE id = ?
        `, [assinatura.id]);
    }
});