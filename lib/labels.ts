export const TIPO_OPERACAO_LABELS: Record<string, string> = {
  CARGA: "Carga",
  DESCARGA: "Descarga",
  ENTREGA: "Entrega",
};

export function labelTipoOperacao(valor: string) {
  return TIPO_OPERACAO_LABELS[valor] || valor;
}
