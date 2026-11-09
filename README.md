# CENA — o som da sua cidade

Plataforma brasileira para descobrir e fazer circular música independente por cidade. O projeto reúne catálogo musical, perfis de artistas, agenda de eventos, playlists e reprodução de faixas.

## Tecnologias

- **Frontend:** React, TypeScript e Vite.
- **Backend:** Node.js, Express e tRPC.
- **Dados:** MySQL com Drizzle ORM e migrations versionadas.
- **Autenticação e arquivos:** Manus OAuth e armazenamento do projeto.
- **Build de produção:** Dockerfile na raiz; Node 22 e pnpm 10.18.0.

## Desenvolvimento local

Requisitos: Node.js 22 e Corepack habilitado.

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

O servidor de desenvolvimento usa a porta 3000 por padrão e respeita a variável `PORT`.

Comandos úteis:

```bash
pnpm check       # verificação TypeScript
pnpm test        # testes automatizados seguros
pnpm build       # build de frontend e servidor
pnpm start       # inicia o build de produção
pnpm db:migrate  # aplica migrations no banco configurado
```

`pnpm db:migrate` e `pnpm db:push` alteram o banco conectado. Não os execute contra produção sem autorização, revisão e backup. Testes de integração que escrevem dados devem usar um banco isolado por `TEST_DATABASE_URL`.

## Estrutura do repositório

- `client/`: aplicação React, páginas, componentes e estilos.
- `server/`: API Express/tRPC, autenticação, regras de acesso e consultas.
- `shared/`: tipos e regras compartilhadas entre cliente e servidor.
- `drizzle/`: schema e migrations do banco.
- `public/`: manifesto, rotas e arquivos públicos.
- `scripts/`: rotinas de manutenção.
- `Dockerfile`: build e inicialização do servidor em produção.
- `docs/`: documentação de operação e publicação.

## GitHub não é o servidor do site

O repositório [`diego47colvin-debug/cena`](https://github.com/diego47colvin-debug/cena) guarda o código. A branch `main` contém as melhorias de cobertura municipal e rotas de detalhe. **Neste momento não há um workflow em `.github/workflows` que publique o site ao receber um push.**

O aplicativo usa backend Express/tRPC e banco MySQL; por isso, GitHub Pages sozinho não consegue executá-lo. A cópia Webdev nova está publicada no Manus em `https://cenaapp-rgtrg8.manus.space`. O site antigo, `https://cena-kn4vk68m.manus.space`, é outro projeto e permanece separado. O envio deste repositório para o GitHub, por si só, não altera nenhum desses sites.

Veja [`docs/publicacao.md`](docs/publicacao.md) antes de publicar. Ele explica o que está configurado hoje e o que falta para automatizar uma publicação que comece no GitHub.

## Segurança

Não envie arquivos `.env`, senhas, tokens, chaves, dados de usuários ou arquivos de produção para o Git. Configure segredos no ambiente de hospedagem. Revise cada migration e cada mudança de schema antes de aplicá-la ao banco de produção.
