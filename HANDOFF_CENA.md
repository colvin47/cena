# HANDOFF MESTRE — CENA

Atualizado em 2026-11-07. Este documento é o guia de transferência do projeto CENA para outra conta/sessão Manus.

## 1. O que é o CENA

CENA é um PWA responsivo de streaming musical e agenda cultural local para artistas, bandas, MCs, produtores, DJs, coletivos, selos e espaços independentes. O recorte editorial é o underground brasileiro: punk, hardcore, post-hardcore, hip hop, rap, grime, beats, música alternativa e derivados.

A proposta não é ser um catálogo genérico. O produto deve fortalecer circulação local, créditos completos, coletividade, agenda, apoio direto e descoberta regional. Não há anúncios no MVP.

## 2. Identidade e experiência

- Visual "Noite Neon": fundo escuro, lima e coral, textura editorial de flyer/rádio comunitária.
- Navegação mobile-first: Início, Buscar, Eventos, Biblioteca e Perfil.
- Player persistente fino, fixo na base, com barra de progresso larga, anterior, play/pause, próxima e fila.
- Linguagem direta, calorosa, inclusiva e ligada à cena local.
- O produto aceita cidades de todo o Brasil, incluindo RS, não apenas Campinas ou SP.

## 3. Estado técnico atual

Projeto Webdev gerenciado:

- Nome: CENA — música independente local.
- Diretório atual desta sessão: `/home/ubuntu/cena`.
- Projeto Webdev: `wdp_a2099fb0eec33870779d498c`.
- Projeto/identificador de publicação: `S494X52htpWYrT5Qi68YCS`.
- Recursos habilitados: servidor, MySQL gerenciado, autenticação e storage.
- Stack: React + Vite, Express, tRPC, Drizzle ORM, MySQL, Manus OAuth, Tailwind/custom CSS e PWA.
- URL pública conhecida: `https://cena-s494x52htpWYrT5Qi68YCS.manus.space`.
- A URL de Preview é temporária; não distribuí-la como URL definitiva.
- A publicação automática estava habilitada no projeto. Confirmar o estado no Dashboard antes de novos pushes.

## 4. Últimos checkpoints

O estado canônico atual está em `origin/main`:

```text
4984316 feat: adicionar sugestao de metadados com IA
70d44d9 feat: conectar sugestões de IA ao upload de faixas
e12bf85 Document custom notification support
321d8c6 Add custom community notifications
d267a61 Document player dock refinement
82888ae Refine persistent player dock
```

Para continuar, partir de `4984316` ou do HEAD de `origin/main`. Não voltar ao checkpoint antigo `321d8c6` sem necessidade.

## 5. Funcionalidades já entregues

- Login Manus OAuth com escolha de ouvinte ou artista.
- Perfis de artista, banda, MC, produtor, DJ, coletivo, selo e espaço.
- Perfil com bio, manifesto, gênero, cidade, redes, Bandcamp, Pix, merch e apoio direto.
- Upload real de áudio e capa via storage, com validação de tipo/tamanho.
- Declaração obrigatória de direitos autorais antes da publicação.
- Formatos: single, álbum, demo, ao vivo, split e compilação.
- Créditos de voz, beat, produção, gravação, mix, master, arte, foto e vídeo.
- Player persistente, progresso, fila, anterior, próxima e reprodução.
- Descoberta por cidade, UF, gênero, formato e busca.
- Catálogo offline-first de 5.570 municípios brasileiros em `client/public/brazil-cities.json`.
- Fallback para consulta oficial do IBGE.
- Agenda de shows, batalhas, cyphers, rodas culturais, festivais DIY, ocupações, feiras de zines, oficinas, escutas coletivas e lançamentos.
- Eventos com preço/gratuidade, programação, acessibilidade, classificação e espaço seguro.
- Interesse em eventos, compartilhamento, calendário `.ics` e cancelamento notificável.
- Playlists, playlists colaborativas, follows e faixas salvas.
- Histórico e notificações in-app.
- Notificações personalizadas para toda a base, restritas à role `admin`.
- Denúncias de faixa, perfil e evento.
- Seed fictício de Campinas com punk, hardcore, post-hardcore, rap, grime, hip hop, beatmakers, DJs, coletivos e agenda underground.
- Páginas legais: `/termos`, `/privacidade`, `/comunidade`, `/direitos` e `/contato`.
- PWA com manifesto, service worker e manifesto de rotas.
- Sugestão de metadados por IA no upload.

## 6. Recurso de IA recém-concluído

Arquivos envolvidos:

- `server/routers.ts`: mutation protegida `scene.suggestTrackMetadata`.
- `client/src/pages/Home.tsx`: dispara a mutation, recebe o resultado, preenche campos e permite aplicar a bio.
- `client/src/index.css`: cartão visual da leitura técnica e da sugestão.

Comportamento:

1. Artista seleciona o áudio.
2. A interface mostra formato e duração detectada pelo navegador.
3. O artista preenche ou revisa título, álbum, gênero, cidade, descrição e créditos.
4. Clica em `Gerar sugestão`.
5. A IA recebe os dados do formulário e do perfil do artista como rascunho editorial.
6. Retorna descrição, gênero, álbum, créditos, bio e até cinco tags.
7. A sugestão preenche campos vazios/prioritários, mas continua editável.
8. A bio pode ser aplicada manualmente ao perfil.
9. A UI informa que a sugestão não confirma autoria, direitos ou créditos.

A IA não deve inventar fatos. Ela não substitui a declaração de direitos nem a revisão do artista. Se futuramente for necessário analisar o conteúdo acústico real, será preciso adicionar upload/URL assinado como entrada para um serviço de transcrição/análise compatível; atualmente o recurso é uma sugestão contextual baseada em metadados, nome do arquivo, formulário e perfil.

## 7. Arquivos principais

- `client/src/App.tsx`: roteamento principal e páginas legais.
- `client/src/pages/Home.tsx`: shell, descoberta, busca, perfil, estúdio, upload, agenda, biblioteca e player.
- `client/src/pages/Legal.tsx`: termos, privacidade, comunidade, direitos e contato.
- `client/src/index.css`: identidade visual e responsividade.
- `client/public/brazil-cities.json`: municípios brasileiros.
- `client/public/manifest.webmanifest`: PWA.
- `client/public/service-worker.js`: cache básico.
- `public/manus-routes.json`: rotas declaradas para Webdev.
- `shared/scene-seed.ts`: dados de demonstração.
- `shared/types.ts`: contratos e tipos compartilhados.
- `drizzle/schema.ts`: usuários, artistas, coletivos, créditos, faixas, playlists, eventos, follows, notificações e moderação.
- `drizzle/`: migrações MySQL.
- `server/db.ts`: consultas e mutações persistentes.
- `server/routers.ts`: contratos tRPC, autorização e mutation da IA.
- `server/storage.ts`: storage de arquivos.
- `plan.md`: decisões de arquitetura e design.
- `TODO.md`: critérios entregues e pendências.

## 8. Comandos para continuar

Executar na raiz do projeto:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm dev
```

Servidor local:

```bash
curl -sS http://127.0.0.1:3000/api/health
curl -sS http://127.0.0.1:3000/manus-routes.json
curl -sS http://127.0.0.1:3000/manifest.webmanifest
curl -sS http://127.0.0.1:3000/brazil-cities.json
```

Scripts disponíveis em `package.json`:

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm check`
- `pnpm test`
- `pnpm db:push`
- `pnpm db:migrate`

Não executar migrações destrutivas no banco compartilhado. O banco de desenvolvimento, teste e produção é compartilhado pelo projeto gerenciado.

## 9. Fluxo de Git e checkpoint

Antes de editar:

```bash
git fetch origin
git status
git log --oneline -5
```

Depois de editar e validar:

```bash
pnpm check
pnpm test
pnpm build
git add <arquivos-intencionais>
git commit -m "tipo: descrição curta"
git push origin main
```

Não usar `force push`. Não sobrescrever alterações não relacionadas. O push em `origin/main` é o que registra o checkpoint canônico do Webdev. Confirmar o SHA no Dashboard/Version history.

## 10. Rotas principais

- `/`
- `/buscar`
- `/eventos`
- `/biblioteca`
- `/perfil`
- `/enviar`
- `/artistas/:handle`
- `/faixas/:id`
- `/eventos/:id`
- `/playlists/:id`
- `/termos`
- `/privacidade`
- `/comunidade`
- `/direitos`
- `/contato`

## 11. Teste prioritário com uma banda do RS

Validar em uma sessão autenticada real no Chrome/My Browser, porque o Preview Sandbox normalmente começa deslogado:

1. Entrar como ouvinte.
2. Selecionar `Porto Alegre, RS`.
3. Seguir um artista e marcar interesse em um evento.
4. Sair e entrar como artista.
5. Criar perfil de banda.
6. Informar nome, @, cidade/UF, gênero, bio e manifesto.
7. Enviar uma faixa curta de teste e uma capa.
8. Confirmar créditos e declaração de direitos.
9. Gerar uma sugestão de IA, revisar e publicar.
10. Criar um evento em Porto Alegre/RS.
11. Abrir links de faixa, perfil e evento em aba anônima.
12. Confirmar que cidade, player, compartilhamento e agenda estão corretos.

## 12. Pendências prioritárias antes da divulgação aberta

1. Validar login real no domínio publicado.
2. Distribuir somente a URL publicada definitiva.
3. Substituir o canal de contato provisório das páginas legais pelo e-mail oficial.
4. Criar painel completo de moderação para revisar denúncias, ocultar conteúdo e bloquear contas.
5. Adicionar retry visual e idempotência ao upload/publicação.
6. Transformar membros e créditos de coletivos em relações editáveis, além do texto livre.
7. Mostrar quem adicionou cada faixa em playlists colaborativas.
8. Fazer piloto com 3–5 projetos independentes do RS.
9. Fazer backup do banco e revisar retenção de arquivos antes de abrir para público maior.
10. Considerar domínio próprio após o piloto fechado.

## 13. Regras que não podem ser removidas

- Não aceitar faixa sem declaração de direitos ou autorização necessária.
- Não misturar o seed de Campinas com uma cidade selecionada sem catálogo.
- Não transformar o CENA em catálogo genérico: coletividade, créditos, circulação e agenda local são centrais.
- Não adicionar anúncios no MVP.
- Apoio direto ao artista deve continuar sem intermediação financeira nesta primeira fase.
- Manter regras contra racismo, LGBTfobia, misoginia, assédio e violência.
- Nunca colocar chaves, cookies, `.env`, tokens ou credenciais em commits, ZIPs, prompts ou mensagens.

## 14. Acessos e segurança

O login da aplicação é feito por Manus OAuth no botão `Entrar na Cena`; não existe usuário/senha fixa para compartilhar. A nova conta deve usar o próprio login autorizado no Manus e, se necessário, pedir acesso ao projeto pelo Dashboard ao proprietário atual.

Não compartilhar:

- `GEMINI_API_KEY`, `OPENAI_API_KEY` ou qualquer segredo de ambiente.
- Cookies de sessão.
- Arquivos `.env` ou `.env.*`.
- URLs privadas de storage.
- Tokens de Git, OAuth ou banco.
- O remote privado do repositório sem autorização.

Se a outra conta não enxergar o projeto no Dashboard, o caminho seguro é compartilhar o ZIP deste handoff ou adicionar a conta como colaboradora pelo mecanismo oficial da plataforma. Não colar credenciais em prompts.

## 15. Prompt mestre para a próxima conta

Cole o texto abaixo na nova conta, junto com este arquivo e o ZIP do projeto:

> Continue o projeto CENA a partir do checkpoint `4984316`, preservando os arquivos existentes e sem reinicializar o projeto. O CENA é um PWA responsivo de streaming e agenda cultural voltado à cena underground brasileira, especialmente punk, hardcore, hip hop, rap, grime e derivados alternativos. O foco é coletividade, circulação regional, créditos completos, apoio direto e agenda local; não adicione anúncios.
>
> Primeiro leia `HANDOFF_CENA.md`, `plan.md` e `TODO.md`, depois inspecione `client/src/pages/Home.tsx`, `client/src/App.tsx`, `client/src/index.css`, `server/routers.ts`, `server/db.ts`, `drizzle/schema.ts`, `shared/types.ts` e `shared/scene-seed.ts`. Preserve o catálogo nacional de 5.570 municípios, incluindo Porto Alegre/RS, o player dock inferior, o fluxo de upload com declaração de direitos e a mutation `scene.suggestTrackMetadata`.
>
> Antes de mudar qualquer coisa, rode `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test` e `pnpm build`. Depois valide o fluxo `/enviar` e priorize um teste autenticado real com Porto Alegre/RS. As próximas prioridades são: validar login publicado, testar upload ponta a ponta com uma banda do RS, trocar o contato provisório das páginas legais, completar moderação, melhorar retry/idempotência de upload e estruturar créditos/membros de coletivos.
>
> Não exponha nem solicite chaves, cookies, `.env`, tokens ou credenciais. Não use force push. Preserve alterações concorrentes, faça commits pequenos e envie somente para `main` após validar.

## 16. Frase curta de recuperação

`Continue o CENA a partir do checkpoint 4984316 usando HANDOFF_CENA.md. Não reinicialize. Preserve o foco no underground brasileiro, valide primeiro login e piloto com Porto Alegre/RS, e não exponha credenciais.`
