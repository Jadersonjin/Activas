import { NextRequest } from "next/server";
import { buscarDadosRelatorioAvarias, nomeArquivoAvarias } from "@/lib/avarias-relatorio";
import { gerarExcelAvarias } from "@/lib/avarias-excel";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const dados = await buscarDadosRelatorioAvarias({
    q: p.get("q") || undefined,
    de: p.get("de") || undefined,
    ate: p.get("ate") || undefined,
    origem: p.get("origem") || undefined,
  });
  const buffer = await gerarExcelAvarias(dados);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomeArquivoAvarias("xlsx")}"`,
    },
  });
}
