import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fmtData } from "@/lib/br-date";

export async function GET(req: NextRequest) {
  const clienteId = req.nextUrl.searchParams.get("clienteId") || "";
  const codigo = req.nextUrl.searchParams.get("codigo") || "";

  if (!clienteId || !codigo.trim()) {
    return NextResponse.json({ encontrados: [] });
  }

  const encontrados = await db.avaria.findMany({
    where: {
      clienteId,
      origem: "RADAR",
      codigoProduto: { contains: codigo.trim(), mode: "insensitive" },
    },
    orderBy: { data: "desc" },
    take: 5,
    select: { descricao: true, lote: true, data: true, observacao: true },
  });

  return NextResponse.json({
    encontrados: encontrados.map((a) => ({
      descricao: a.descricao,
      lote: a.lote,
      data: fmtData(a.data),
      observacao: a.observacao,
    })),
  });
}
