# Contas — Controlo financeiro pessoal

Aplicação web em português para registar despesas, receitas e poupanças em euros. Construída com Next.js, React, Tailwind CSS, Prisma e PostgreSQL.

## Executar com Docker (recomendado para testar)

Requer Docker Desktop ou Docker Engine com Docker Compose. Na raiz do projeto, execute:

```bash
docker compose up --build
```

Quando o PostgreSQL estiver pronto, a aplicação gera o cliente Prisma, cria/atualiza as tabelas e inicia em modo de desenvolvimento. Abra [http://localhost:3000](http://localhost:3000) e crie uma conta. Os dados da base de dados ficam guardados no volume Docker `postgres_data`.

Para parar os serviços, use `Ctrl+C` e depois `docker compose down`. Para apagar também os dados guardados e começar de novo, execute `docker compose down -v`.

O container de desenvolvimento usa credenciais locais predefinidas. Não as reutilize num ambiente público ou de produção. Para substituir o segredo de sessão, defina `SESSION_SECRET` no ambiente antes de iniciar o Compose.

## Executar sem Docker

Requer Node.js 20.9 ou superior e PostgreSQL.

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env` e configure `DATABASE_URL`.
3. Defina `SESSION_SECRET` com uma chave aleatória e privada de pelo menos 32 caracteres.
4. Crie/atualize as tabelas e gere o cliente Prisma: `npx prisma db push`
5. Inicie a aplicação: `npm run dev`

No primeiro registo são criadas automaticamente as categorias padrão da conta. O nome informado no registo fica associado ao perfil e é utilizado na aplicação. A coluna de nome tem um valor predefinido vazio, pelo que as contas anteriores são preservadas sem alterar os restantes dados; os nomes dessas contas podem ser completados futuramente.

## Funcionalidades

- Registo com nome, email e palavra-passe, além de início de sessão com passwords hashadas com bcrypt e cookie JWT `httpOnly`, `sameSite` e `secure` em produção.
- Dados de transações e categorias personalizados isolados por utilizador.
- Categorias padrão e categorias personalizadas para receitas e despesas.
- Registo e eliminação de transações, com relatórios de receitas e despesas reais.
- Transferências para poupanças e levantamentos com proteção contra saldos insuficientes; resumos e indicadores de poupança calculados apenas para o mês selecionado.
- Migração automática e idempotente dos valores guardados na funcionalidade anterior "Poupado (Reservado)".
- Resumo mensal, distribuição de despesas por categoria e exportação CSV.
- Interface responsiva e valores formatados em euros (`pt-PT`).

As categorias padrão são criadas por utilizador, permitindo que cada conta as consulte sem expor categorias privadas ou depender de dados globais partilhados.
