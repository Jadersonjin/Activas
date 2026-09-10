import { db } from "@/lib/db";

export async function itensPendentes(inventarioId: string) {
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

  return itens.filter((item) => !resolvidos.has(item.id));
}
