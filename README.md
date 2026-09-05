# Controle Operacional — Patio & Armazem

App de controle diario de operacoes de armazem: chegada/liberacao/operacao do veiculo, servicos utilizados (pallet e stretch, com controle de pallet proprio de cliente), avarias e presenca de carga.

Feito em Next.js (App Router) + Prisma + PostgreSQL, pronto para deploy na Vercel a partir do GitHub.

## Modulos

1. **Processos diarios** — cadastro do veiculo/cliente e registro com um clique de: chegada, liberacao, inicio e fim da operacao.
2. **Servicos utilizados** — apontamento de pallet e stretch por processo. Para clientes que usam pallet proprio, marque a opcao "pallet proprio" no servico: em vez de contar como cobranca normal, o sistema abate automaticamente do saldo comprado pelo cliente.
3. **Saldo de pallets** — tela por cliente com o saldo atual (compras − consumo), historico de movimentacoes, registro de novas compras e ajustes manuais.
4. **Avarias** — codigo do produto, descricao, lote, peso da avaria, localizacao/endereco no armazem e se foi identificada em varredura.
5. **Presenca de carga** — formalizacao da chegada de material: fornecedor, numero da nota, produto, quantidade e data de chegada.

Existe tambem um **cadastro de clientes** (multi-cliente desde o inicio) e **login com papeis** (Administrador / Operador).

## Rodando localmente

1. Instale as dependencias:
   ```bash
   npm install
   ```
2. Copie `.env.example` para `.env` e preencha `DATABASE_URL` (veja abaixo como conseguir um banco Postgres gratuito) e um `SESSION_SECRET` aleatorio.
3. Crie as tabelas no banco:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Crie o primeiro usuario administrador:
   ```bash
   npm run db:seed
   ```
5. Rode o projeto:
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000` e faca login com o e-mail/senha definidos em `SEED_ADMIN_EMAIL` / `SEED_ADMIN_SENHA` (padrao: `admin@brasmeg.com.br` / `mude-esta-senha` — troque depois).

## Banco de dados gratuito (Postgres)

Qualquer um destes serve, todos tem plano gratuito compativel com Vercel:

- **Neon** (neon.tech) — recomendado, integra direto com a Vercel em 2 cliques.
- **Supabase** (supabase.com)
- **Vercel Postgres** (dentro do proprio painel da Vercel)

Depois de criar o banco, copie a "connection string" para `DATABASE_URL` (e `DIRECT_URL`, se o provedor fornecer uma URL separada para migrations).

## Subindo para o GitHub

```bash
git init
git add .
git commit -m "Primeira versao do controle operacional"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/armazem-control.git
git push -u origin main
```

## Deploy na Vercel

1. Em vercel.com, clique em **Add New → Project** e importe o repositorio do GitHub.
2. Em **Environment Variables**, adicione `DATABASE_URL`, `DIRECT_URL` (se aplicavel) e `SESSION_SECRET` com os mesmos valores do seu `.env`.
3. Clique em **Deploy**. O comando de build ja roda `prisma generate` automaticamente.
4. Depois do primeiro deploy, rode as migrations e o seed contra o banco de producao (pelo terminal local, apontando o `.env` para a `DATABASE_URL` de producao):
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
5. Acesse a URL gerada pela Vercel e faca login.

## Proximos ajustes sugeridos

- Tela de cadastro/edicao de usuarios da equipe (hoje o seed cria so o admin — novos usuarios podem ser inseridos direto no banco ou por uma tela futura).
- Edicao/exclusao de registros ja lancados (hoje o foco e lancamento rapido do dia a dia).
- Upload de foto nas avarias (o campo `fotoUrl` ja existe no banco, falta a tela de upload).
- Relatorios/exportacao (ex: presenca de carga do dia, avarias por cliente).
