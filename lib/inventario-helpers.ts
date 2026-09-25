import { db } from "@/lib/db";

// Itens que ainda precisam de contagem NESTA rodada:
// - nunca bateram com o esperado em nenhuma rodada anterior (não resolvidos), E
// - ainda não foram apontados nesta rodada específica (senão o conferente ficaria
//   vendo o mesmo item de novo até acertar — a recontagem de itens divergentes
//   fica pra próxima rodada, não pra agora)
export async function itensPendentes(inventarioId: string, rodadaId?: string) {
  const [itens, contagens] = await Promise.all([
    db.inventarioItemEsperado.findMany({ where: { inventarioId } }),
    db.inventarioContagem.findMany({
      where: { itemEsperado: { inventarioId } },
      include: { itemEsperado: true },
    }),
  ]);

  const resolvidos = new Set(
    contagens
      .filter((c) => Number(c.quantidadeContada) === Number(c.itemEsperado.quantidadeEsperada))
      .map((c) => c.itemEsperadoId)
  );

  const jaContadosNestaRodada = new Set(
    rodadaId ? contagens.filter((c) => c.rodadaId === rodadaId).map((c) => c.itemEsperadoId) : []
  );

  return itens.filter((item) => !resolvidos.has(item.id) && !jaContadosNestaRodada.has(item.id));
}
