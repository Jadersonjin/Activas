import { db } from "@/lib/db";
import type { InventarioItemEsperado, InventarioContagem } from "@prisma/client";

export type ItemDetalheGrupo = {
  item: InventarioItemEsperado;
  ultimaContagem: InventarioContagem | null;
};

export type GrupoLote = {
  chave: string;
  codigoProduto: string;
  lote: string;
  descricao: string;
  itensDetalhe: ItemDetalheGrupo[];
  esperadoTotal: number;
  contadoTotal: number;
  todosContados: boolean;
  status: "PENDENTE" | "OK" | "DIVERGENTE";
};

// Agrupa os itens esperados por produto+lote (posição não entra na comparação —
// é só informativa, pra localizar o material). O saldo é sempre avaliado pelo
// TOTAL do lote somando todas as posições onde ele aparece.
export async function calcularGrupos(inventarioId: string): Promise<GrupoLote[]> {
  const [itens, contagens] = await Promise.all([
    db.inventarioItemEsperado.findMany({ where: { inventarioId } }),
    db.inventarioContagem.findMany({
      where: { itemEsperado: { inventarioId } },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  const ultimaContagemPorItem = new Map<string, InventarioContagem>();
  for (const c of contagens) {
    if (!ultimaContagemPorItem.has(c.itemEsperadoId)) ultimaContagemPorItem.set(c.itemEsperadoId, c);
  }

  const grupos = new Map<string, { codigoProduto: string; lote: string; descricao: string; itens: InventarioItemEsperado[] }>();
  for (const item of itens) {
    const chave = `${(item.codigoProduto || item.descricao).toLowerCase()}::${item.lote.toLowerCase()}`;
    if (!grupos.has(chave)) {
      grupos.set(chave, { codigoProduto: item.codigoProduto, lote: item.lote, descricao: item.descricao, itens: [] });
    }
    grupos.get(chave)!.itens.push(item);
  }

  return Array.from(grupos.entries()).map(([chave, g]) => {
    const itensDetalhe: ItemDetalheGrupo[] = g.itens.map((item) => ({
      item,
      ultimaContagem: ultimaContagemPorItem.get(item.id) || null,
    }));
    const esperadoTotal = g.itens.reduce((soma, i) => soma + Number(i.quantidadeEsperada), 0);
    const todosContados = itensDetalhe.every((d) => d.ultimaContagem !== null);
    const contadoTotal = itensDetalhe.reduce(
      (soma, d) => soma + (d.ultimaContagem ? Number(d.ultimaContagem.quantidadeContada) : 0),
      0
    );
    const status: GrupoLote["status"] = !todosContados ? "PENDENTE" : contadoTotal === esperadoTotal ? "OK" : "DIVERGENTE";

    return { chave, codigoProduto: g.codigoProduto, lote: g.lote, descricao: g.descricao, itensDetalhe, esperadoTotal, contadoTotal, todosContados, status };
  });
}

// Itens (posições) que ainda precisam de algum apontamento — pra qualquer efeito
// (fechar rodada, contar quantos faltam), sem levar em conta se é "nesta rodada".
// - Grupo DIVERGENTE (todas as posições já contadas, mas o total não bate): todas
//   as posições do grupo precisam ser recontadas, já que não dá pra saber qual
//   posição específica está errada.
// - Grupo PENDENTE (ainda falta contar alguma posição): só as posições que nunca
//   foram contadas.
export async function itensNaoResolvidos(inventarioId: string): Promise<InventarioItemEsperado[]> {
  const grupos = await calcularGrupos(inventarioId);
  const pendentes: InventarioItemEsperado[] = [];
  for (const g of grupos) {
    if (g.status === "OK") continue;
    if (g.status === "DIVERGENTE") {
      pendentes.push(...g.itensDetalhe.map((d) => d.item));
    } else {
      pendentes.push(...g.itensDetalhe.filter((d) => !d.ultimaContagem).map((d) => d.item));
    }
  }
  return pendentes;
}

// Itens que o conferente ainda precisa apontar NESTA rodada específica — igual
// itensNaoResolvidos, mas tirando quem já foi apontado nesta rodada (senão o
// conferente ficaria vendo a mesma posição de novo até fechar a rodada).
export async function itensPendentes(inventarioId: string, rodadaId?: string): Promise<InventarioItemEsperado[]> {
  const [naoResolvidos, contagensNestaRodada] = await Promise.all([
    itensNaoResolvidos(inventarioId),
    rodadaId
      ? db.inventarioContagem.findMany({ where: { rodadaId }, select: { itemEsperadoId: true } })
      : Promise.resolve([] as { itemEsperadoId: string }[]),
  ]);

  const jaContadosNestaRodada = new Set(contagensNestaRodada.map((c) => c.itemEsperadoId));
  return naoResolvidos.filter((item) => !jaContadosNestaRodada.has(item.id));
}
