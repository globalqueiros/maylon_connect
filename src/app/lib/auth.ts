import { sessaoDaRequisicao } from "./sessaoServidor";

/**
 * Usuário logado pelo validador central de sessão (cookie access_token do
 * login ou Bearer). Antes lia um cookie "auth_token" que o login nunca grava
 * e convertia o id (UUID) em número, então estas rotas nunca reconheciam
 * ninguém. Sessão revogada/encerrada não passa.
 */
export async function getUsuarioLogado(req?: Request): Promise<{
  id: string;
  usuario_id: string;
  /** user_type do login (customer/driver...). */
  tipo: string;
} | null> {
  const sessao = await sessaoDaRequisicao(req);
  if (!sessao.ok) return null;

  return {
    id: sessao.userId,
    usuario_id: sessao.userId,
    tipo: sessao.userType,
  };
}
