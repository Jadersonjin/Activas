import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const clienteId = req.nextUrl.searchParams.get("clienteId") || "";
  const q = req.nextUrl.searchParams.get("q") || "";

  if (!clienteId) return NextResponse.json({ produtos: [] });

  const produtos = await db.produto.findMany({
    where: {
      clienteId,
      ativo: true,
      ...(q.trim()
        ? {
            OR: [
              { codigo: { contains: q.trim(), mode: "insensitive" } },
              { descricao: { contains: q.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { codigo: "asc" },
    take: 15,
    select: { codigo: true, descricao: true },
  });

  return NextResponse.json({ produtos });
}
