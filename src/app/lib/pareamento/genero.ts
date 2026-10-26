export type Genero = "feminino" | "masculino" | "outro";

/** De onde veio o gênero: documento verificado (Didit) ou cadastro do usuário. */
export type FonteGenero = "didit" | "cadastro";

const FEMININO = new Set(["f", "fem", "female", "feminino", "mulher"]);
const MASCULINO = new Set(["m", "male", "masculino", "homem"]);
const OUTRO = new Set(["x", "other", "others", "outro", "outros"]);

/**
 * Converte o valor bruto (coluna do cadastro ou campo do documento) em um
 * gênero conhecido. Valor desconhecido ou numérico ambíguo vira null: na
 * dúvida, o gênero não conta como confirmado.
 */
export function normalizarGenero(valor: unknown): Genero | null {
  if (typeof valor !== "string") return null;

  const texto = valor.trim().toLowerCase();
  if (!texto) return null;

  if (FEMININO.has(texto)) return "feminino";
  if (MASCULINO.has(texto)) return "masculino";
  if (OUTRO.has(texto)) return "outro";

  return null;
}

const TIPOS_MOTORISTA = new Set([
  "driver",
  "motorista",
  "motorista parceiro",
  "motorista_parceiro",
]);

export function ehTipoMotorista(tipo: unknown): boolean {
  return TIPOS_MOTORISTA.has(String(tipo ?? "").trim().toLowerCase());
}
