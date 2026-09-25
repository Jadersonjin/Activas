import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const login = process.env.SEED_ADMIN_LOGIN || process.env.SEED_ADMIN_EMAIL || "admin";
  const senha = process.env.SEED_ADMIN_SENHA || "mude-esta-senha";
  const nome = process.env.SEED_ADMIN_NOME || "Administrador";

  const existente = await db.usuario.findUnique({ where: { login } });
  if (existente) {
    console.log(`Usuário ${login} já existe, nada a fazer.`);
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  await db.usuario.create({
    data: { nome, login, senhaHash, papel: "ADMIN" },
  });

  console.log(`Usuário admin criado: ${login} / senha inicial: ${senha}`);
  console.log("Troque a senha assim que possível.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
