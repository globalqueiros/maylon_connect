import { db } from "./db";

/**
 * Guarda a solicitação do cartão Caju em campo separado.
 *
 * O protocolo continua existindo pra equipe acompanhar, mas ele guarda tudo
 * como texto. A API do Caju precisa de cada dado isolado, então o pedido fica
 * também na caju_beneficios, já no formato que a integração vai usar.
 */

export type PedidoCartaoCaju = {
  usuarioId: string;
  beneficioId: number;
  pedidoCodigo: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

export async function salvarPedidoCartaoCaju(
  pedido: PedidoCartaoCaju,
): Promise<void> {
  await db.execute(
    `
      INSERT INTO caju_beneficios (
        usuario_id,
        beneficio_id,
        pedido_codigo,
        nome,
        email,
        cpf,
        telefone,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        status_cartao,
        criado_em
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aguardando_envio', NOW())
    `,
    [
      pedido.usuarioId,
      pedido.beneficioId,
      pedido.pedidoCodigo,
      pedido.nome,
      pedido.email,
      pedido.cpf,
      pedido.telefone,
      pedido.cep,
      pedido.endereco,
      pedido.numero,
      pedido.complemento,
      pedido.bairro,
      pedido.cidade,
      pedido.estado,
    ],
  );
}

/**
 * Monta o pedido no formato de envio, a partir do que já está gravado.
 *
 * É aqui que a integração com a API do Caju entra: a chamada de emissão do
 * cartão recebe exatamente este objeto, e a resposta do Caju volta pra
 * caju_beneficios atualizando status_cartao.
 */
export function montarPedidoParaEnvio(pedido: PedidoCartaoCaju) {
  return {
    documento: pedido.cpf,
    nome: pedido.nome,
    email: pedido.email,
    telefone: pedido.telefone,
    endereco: {
      cep: pedido.cep,
      logradouro: pedido.endereco,
      numero: pedido.numero,
      complemento: pedido.complemento || null,
      bairro: pedido.bairro,
      cidade: pedido.cidade,
      estado: pedido.estado,
    },
    referencia: pedido.pedidoCodigo,
  };
}
