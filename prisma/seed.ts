import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@brasmeg.com.br";
  const senha = process.env.SEED_ADMIN_SENHA || "mude-esta-senha";
  const nome = process.env.SEED_ADMIN_NOME || "Administrador";

  const existente = await db.usuario.findUnique({ where: { email } });
  if (existente) {
    console.log(`Usuário ${email} já existe, nada a fazer.`);
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  await db.usuario.create({
    data: { nome, email, senhaHash, papel: "ADMIN" },
  });

  console.log(`Usuário admin criado: ${email} / senha inicial: ${senha}`);
  console.log("Troque a senha assim que possível.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
