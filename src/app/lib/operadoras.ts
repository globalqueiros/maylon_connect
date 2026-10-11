/**
 * Operadoras de celular aceitas pela recarga.
 *
 * O portfólio da RVHub tem sempre as mesmas 4 operadoras habilitadas
 * (VIVO, CLARO, OI, TIM), então a tela usa esta lista fixa em vez de
 * consultar a API. O backend segue validando cada operadora contra o
 * portfólio real antes de concluir a recarga.
 *
 * O `nome` é enviado como `provider` e o backend casa de forma
 * case-insensitive ("Claro" -> "CLARO").
 */
export type Operadora = {
  id: string;
  nome: string;
  cor: string;
  logo: string;
};

export const OPERADORAS_CELULAR: Operadora[] = [
  { id: "vivo", nome: "Vivo", cor: "#660099", logo: "VIVO" },
  { id: "claro", nome: "Claro", cor: "#E30613", logo: "CLARO" },
  { id: "oi", nome: "Oi", cor: "#FFCC00", logo: "Oi" },
  { id: "tim", nome: "TIM", cor: "#003B7A", logo: "TIM" },
];
