# Resultados do CENA Mobile

## Continuidade

- [x] **App nativo Expo/React Native.** Usa telas nativas sem WebView; o site é auxiliar para ouvir e gerir o catálogo. Descoberta, reprodução e favoritos locais foram preservados.
- [ ] **Descoberta e detalhes ligados ao catálogo real.** Validar cidade, gênero, texto, faixa, artista e evento depois da publicação das rotas; nunca apresentar demos como uploads reais.
- [ ] **Ingressos e merchandise nativos.** Usar as consultas existentes, exibir preço/disponibilidade/destino externo; não fazer checkout nem mutations de teste.
- [x] **Player persistente.** Mantém controles e faixa selecionada entre telas.
- [ ] **Conta, biblioteca e privacidade.** O login Manus nativo está implementado no app, mas ações autenticadas dependem das rotas publicadas; favoritos locais permanecem privados e nenhum JWT vai para deep link.
- [ ] **Perfil artístico e upload real.** Formulário móvel implementado; operação real exige sessão válida, perfil de artista/banda, permissões, upload e resposta real do servidor.
- [ ] **APK final.** EAS `@colvindiegoss-team/cena`, slug `cena`, projectId `20f42d9f-0388-4563-8601-f6c579bbbafb`. A branch isolada `manus-cenacopy-preview` aponta para `https://cenacopy-rjglbygs.manus.space`; `main`, `feat/native-first-app-commerce` e o APK anterior permanecem intactos. Não gerar novo APK antes de publicar as rotas backend.

## Login Manus e upload

- [x] **Login nativo seguro preparado.** Navegador do sistema, `state` validado, ticket opaco, curto e single-use no deep link, troca por sessão Bearer no servidor e armazenamento em `SecureStore`; sem JWT no deep link e sem associação automática por e-mail.
- [x] **Upload móvel preparado.** MP3/WAV/M4A/OGG até 50 MB; capa opcional JPG/JPEG/PNG/WebP até 10 MB; exige perfil artístico, título e declaração de direitos; reutiliza `/api/upload` e `scene.createTrack` com idempotência e permissões `owner`/`editor`.
- [x] **Backend preparado no GitHub.** Commit `ea2ca9f` adiciona rotas OAuth, tickets single-use e migration aditiva `drizzle/0015_mobile_oauth_tickets.sql`; `pnpm check`, 29 testes (2 ignorados) e `pnpm build` passaram. O fallback OAuth foi corrigido localmente para `cenacopy-rjglbygs.manus.space`; ainda falta sincronizar essa correção ao projeto certo.
- [ ] **Aplicar/publicar no Webdev correto.** O histórico confirma `cenacopy-rjglbygs.manus.space` → projeto `wdp_d86254bcd5a66ebd554a6e5a`, UID `RjGLBYGsPa7YaZVQ99LQKX` (“CENA — cópia de teste funcional”). `wdp_694` publica outro site, `cena-kn4vk68m`, e não deve ser usado. O convite para a tarefa `Site Cenacopy` foi aceito; o painel do projeto está visível, mas `webdev.config` desta sessão continua em `wdp_9468289fbe7e123d3c435842`. A execução da tarefa `Site Cenacopy` está ativa e tratando troca de áudio/foto de capa; não iniciar outra execução concorrente. Login/upload não estão publicados e a migration não foi aplicada.

## Verificação e bloqueios

- [x] Validações locais anteriores passaram; nenhum login real, upload de áudio, mutation ou gravação de usuário foi executado. O APK anterior permanece intacto.
- [x] Backend base enviado ao GitHub `main` no commit `ea2ca9f`; `feat/native-first-app-commerce` permaneceu intacta. O push não publica `wdp_d862`, cujo painel GitHub não está conectado.
- [x] `eas.json`, `.env.example` e este guia usam o domínio confirmado `https://cenacopy-rjglbygs.manus.space`.
- [ ] **Próximo passo:** incorporar OAuth/upload ao código Webdev `wdp_d862`, registrar checkpoint, publicar e confirmar migration; depois gerar e testar APK `preview` no Android.

## Trabalho visual aprovado

- [x] Paleta escura CENA e identidade aprovadas.
- [x] Busca/filtro de gênero aceita digitação livre com debounce e preserva resultados durante atualização.
