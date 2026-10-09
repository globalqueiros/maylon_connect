import { listarProviders } from "./client";

/**
 * Gift cards habilitados na tela (kind "pin" na RVHub). A conta pode ter
 * outros providers de PIN; aqui só liberamos os que aparecem na UI.
 */
export const GIFT_CARD_PROVIDERS = [
  "NETFLIX",
  "SPOTIFY",
  "GOOGLE PLAY",
  "PLAYSTATION",
] as const;

/**
 * Resolve o provider exato de PIN da RVHub, garantindo que ele está na
 * lista liberada para a tela. Aceita nome exato ou id minúsculo.
 */
export async function resolverPinProvider(
  valorRecebido: string
): Promise<string | null> {
  const alvo = valorRecebido.trim().toLowerCase();
  if (!alvo) return null;

  const permitidos = GIFT_CARD_PROVIDERS.map((p) => p.toLowerCase());
  if (!permitidos.includes(alvo)) return null;

  const providers = await listarProviders();
  const pin = providers.filter((p) => p.kind === "pin");
  return pin.find((p) => p.provider.toLowerCase() === alvo)?.provider ?? null;
}
