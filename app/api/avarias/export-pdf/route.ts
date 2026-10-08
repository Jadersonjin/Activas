import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buscarDadosRelatorioAvarias, nomeArquivoAvarias } from "@/lib/avarias-relatorio";
import { gerarPdfAvarias } from "@/lib/avarias-pdf";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const dados = await buscarDadosRelatorioAvarias({
    q: p.get("q") || undefined,
    de: p.get("de") || undefined,
    ate: p.get("ate") || undefined,
    origem: p.get("origem") || undefined,
  });

  // Logo é opcional: se o arquivo não estiver disponível no servidor, o PDF sai sem ele
  let logo: string | undefined;
  try {
    const png = await readFile(path.join(process.cwd(), "public", "logo-brasmeg.png"));
    logo = `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    logo = undefined;
  }

  const pdf = gerarPdfAvarias(dados, logo);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomeArquivoAvarias("pdf")}"`,
    },
  });
}
