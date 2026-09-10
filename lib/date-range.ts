import { inicioDiaBR, fimDiaBR } from "@/lib/br-date";

export function rangeDia(de?: string, ate?: string) {
  const where: { gte?: Date; lte?: Date } = {};
  if (de) where.gte = inicioDiaBR(de);
  if (ate) where.lte = fimDiaBR(ate);
  return Object.keys(where).length ? where : undefined;
}
