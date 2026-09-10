const FUSO = "America/Sao_Paulo";

export function hojeBR() {
  return new Date().toLocaleDateString("en-CA", { timeZone: FUSO });
}

export function inicioDiaBR(dataStr: string) {
  return new Date(`${dataStr}T00:00:00-03:00`);
}

export function fimDiaBR(dataStr: string) {
  return new Date(`${dataStr}T23:59:59.999-03:00`);
}

export function fmtData(data: Date | string) {
  return new Date(data).toLocaleDateString("pt-BR", { timeZone: FUSO });
}

export function fmtHora(data: Date | string) {
  return new Date(data).toLocaleTimeString("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDataHora(data: Date | string) {
  return new Date(data).toLocaleString("pt-BR", { timeZone: FUSO });
}

export function fmtDataLonga(data: Date | string) {
  return new Date(data).toLocaleDateString("pt-BR", {
    timeZone: FUSO,
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}
