# Sistema de Gestão de Imóveis

Sistema web local para gerenciamento de imóveis, unidades, inquilinos, contratos, pagamentos e despesas.

---

## Pré-requisitos

- **Node.js 20 LTS ou superior**
  Download: https://nodejs.org/en/download
  Instale a versão LTS. Marque a opção "Add to PATH" durante a instalação.

---

## Primeira execução (apenas uma vez)

1. Extraia o projeto em uma pasta (ex: `C:\imoveis-app`)
2. Dê duplo clique em **`setup.bat`**
3. Aguarde a instalação finalizar
4. Dê duplo clique em **`iniciar.bat`**

O navegador abrirá automaticamente em `http://localhost:3000`.

---

## Uso diário

Dê duplo clique em **`iniciar.bat`** para iniciar o sistema.

Para encerrar, feche a janela do terminal que ficou aberta.

---

## Desenvolvimento

Para rodar com hot reload (recarrega ao salvar arquivos):

```
dev.bat
```

---

## Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia com hot reload (tsx watch) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm run start` | Inicia o servidor compilado |
| `npm run db:push` | Aplica o schema no banco SQLite |
| `npm run db:generate` | Regenera o Prisma client |
| `npm run db:studio` | Abre o Prisma Studio (visualizador do banco) |
| `npm run db:seed` | Insere dados de exemplo para teste |

---

## Estrutura do projeto

```
imoveis-app/
├── prisma/
│   └── schema.prisma        # Definição do banco de dados
├── src/
│   ├── server.ts            # Entry point
│   ├── config.ts            # Configurações
│   ├── database.ts          # Instância do Prisma
│   ├── modules/             # Módulos por funcionalidade
│   │   ├── dashboard/
│   │   ├── imoveis/
│   │   ├── unidades/
│   │   ├── inquilinos/
│   │   ├── contratos/
│   │   ├── pagamentos/
│   │   ├── despesas/
│   │   └── alertas/
│   ├── plugins/             # Plugins do Fastify
│   └── shared/              # Utilitários compartilhados
├── views/                   # Templates Handlebars
│   ├── layouts/main.hbs     # Layout base (sidebar + topbar)
│   └── [módulo]/index.hbs   # Páginas por módulo
├── public/                  # Arquivos estáticos
│   ├── css/app.css
│   └── js/app.js
├── data/                    # Banco SQLite (gerado automaticamente)
├── scripts/seed.ts          # Dados de exemplo
├── iniciar.bat              # Iniciar o sistema
├── setup.bat                # Configuração inicial
└── dev.bat                  # Modo desenvolvimento
```

---

## Banco de dados

O banco SQLite fica em `data/imoveis.db` (pasta `data/` na raiz do projeto). Para visualizar os dados diretamente:

```
npx prisma studio
```

Para fazer backup, basta copiar o arquivo `data/imoveis.db`.

> **Nota técnica:** o `DATABASE_URL` no `.env` usa `file:../data/imoveis.db` — o caminho é relativo à pasta `prisma/`, não à raiz do projeto. Isso garante que tanto o CLI do Prisma quanto o runtime do Node encontrem o arquivo no mesmo lugar (`data/` na raiz).

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20 LTS |
| Linguagem | TypeScript |
| Servidor HTTP | Fastify |
| ORM | Prisma |
| Banco de dados | SQLite |
| Frontend | Handlebars + Alpine.js + Tailwind CSS |
| Gráficos | Chart.js (CDN) |