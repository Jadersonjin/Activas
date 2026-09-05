export function rangeDia(de?: string, ate?: string) {
  const where: { gte?: Date; lte?: Date } = {};
  if (de) where.gte = new Date(`${de}T00:00:00`);
  if (ate) where.lte = new Date(`${ate}T23:59:59.999`);
  return Object.keys(where).length ? where : undefined;
}
