# Contas — Controlo financeiro pessoal

Aplicação web em português para registar despesas, receitas e poupanças em euros. Construída com Next.js, React, Tailwind CSS, Prisma e PostgreSQL.

## Requisitos

- Node.js 20.9 ou superior
- PostgreSQL

## Configuração

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env` e configure `DATABASE_URL`.
3. Defina `SESSION_SECRET` com uma chave aleatória e privada de pelo menos 32 caracteres.
4. Crie/atualize as tabelas e gere o cliente Prisma: `npx prisma db push`
5. Inicie a aplicação: `npm run dev`

Abra [http://localhost:3000](http://localhost:3000). No primeiro registo são criadas automaticamente as categorias padrão da conta.

## Funcionalidades

- Registo e início de sessão com passwords hashadas com bcrypt e cookie JWT `httpOnly`, `sameSite` e `secure` em produção.
- Dados de transações e categorias personalizados isolados por utilizador.
- Categorias padrão e categorias personalizadas para receitas e despesas.
- Registo e eliminação de transações, com opção para reservar uma parte de cada receita como poupança.
- Resumo mensal, distribuição de despesas por categoria e exportação CSV.
- Interface responsiva e valores formatados em euros (`pt-PT`).

As categorias padrão são criadas por utilizador, permitindo que cada conta as consulte sem expor categorias privadas ou depender de dados globais partilhados.
