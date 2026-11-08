# CENA — entrega do perfil central e catálogo do artista

## Alterações implementadas

A página `/perfil` agora apresenta uma visão geral permanente para contas autenticadas. Para artistas e bandas, ela mostra identidade visual, cidade, handle, métricas, atividade, faixas publicadas e próximos eventos. Para ouvintes, mostra cidade, bio, gêneros, artistas seguidos, faixas salvas, playlists e eventos de interesse.

Foi criada a consulta protegida `scene.artistCatalog`, que busca diretamente as faixas e eventos do artista proprietário. Essa consulta não depende do filtro de cidade, gênero ou busca usado na Home.

Depois de uma publicação, o fluxo invalida a descoberta, atualiza o catálogo próprio e navega para `/perfil?publicado=1`. A faixa publicada aparece na área “Músicas publicadas” e pode ser tocada imediatamente pelo player.

A descoberta também foi corrigida para não substituir um banco disponível e sem resultados pelo conteúdo seed de Campinas. O seed continua disponível quando o banco não está configurado; quando o banco está ativo, uma cidade sem catálogo é exibida como vazia.

## Arquivos principais

- `client/src/components/AccountProfileView.tsx`: novo perfil central de ouvinte/artista.
- `client/src/pages/Home.tsx`: consulta do catálogo, integração do perfil e redirecionamento pós-upload.
- `client/src/index.css`: layout responsivo do perfil, lançamentos e agenda.
- `server/db.ts`: consulta protegida do catálogo próprio do artista.
- `server/routers.ts`: procedimento `artistCatalog` e correção do fallback seed.
- `TODO.md`: ciclo 6 registrado.

## Validação

- `pnpm check`: aprovado.
- `pnpm test`: aprovado — 19 testes passaram; 2 testes de integração foram ignorados por dependerem de ambiente externo.
- `pnpm build`: aprovado.
- O build mantém apenas avisos existentes do Vite sobre `config.js` sem `type="module"` e tamanho de chunk.

## Publicação

Esta cópia foi validada isoladamente em `/home/ubuntu/cena-4984316`. Ela ainda não foi publicada, pois o projeto Webdev atualmente vinculado ao ambiente é outro. Publicar diretamente no projeto vinculado poderia substituir a versão errada do CENA.

## Banco e publicação

O banco compartilhado estava em um estado legado: tabelas básicas existiam, mas coletivos, convites, auditoria e várias colunas novas ainda não. Foi executada uma reconciliação idempotente, sem truncamento, e o comando foi salvo como `pnpm db:reconcile` em `scripts/reconcile-legacy-schema.mjs`. Depois da reconciliação, todos os 21 testes passaram, incluindo os dois testes de integração MySQL de convites.
