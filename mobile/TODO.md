# Resultados do CENA Mobile

## Continuidade do plano anterior

- [x] **App nativo Expo/React Native.** O CENA Mobile usa telas nativas, sem WebView; o site permanece alternativa para ouvir e gerir o catálogo. O código é mantido em branch isolada e a API é externa ao app.
- [ ] **Descoberta, busca e detalhes ligados ao catálogo CENA.** Usar as queries públicas existentes para filtrar por cidade, gênero e texto; abrir detalhes de faixa, artista e evento; distinguir carregamento, indisponibilidade, catálogo vazio e conteúdo demonstrativo. Nunca apresentar amostras como uploads reais. Requer validação depois da implantação autorizada da API.
- [ ] **Ingressos e merchandise em telas nativas.** Consultar somente `scene.eventTickets` e `scene.artistMerchandise`; mostrar preço, disponibilidade, estoque e destino externo sem checkout ou reservas. Não expor eventos/artistas ocultos nem itens indisponíveis; nenhum teste deve criar mutations ou escrever no banco compartilhado. Depende do backend e das migrations autorizadas do CENA.
- [x] **Player nativo persistente.** Reproduz a faixa selecionada, mantém controles entre telas, apresenta play/pause e progresso e não troca para uma demo por coincidência de ID ou fallback.
- [ ] **Conta, biblioteca e privacidade.** Favoritos locais permanecem privados. A sessão Manus nativa está implementada no código desta branch, mas só deverá habilitar ações autenticadas após a API validar o login e o backend receber a migration necessária; não simular login nem expor JWT em deep link.
- [ ] **Perfil artístico e publicação real.** O formulário móvel de perfil e envio está implementado no código. Para ser considerado operacional, precisa de sessão Manus validada, perfil artístico, upload de áudio/capa pelo endpoint CENA, validações de direitos, formato, tamanho, propriedade, autorização e resposta real do servidor. Não enviar arquivo real nem criar perfil real durante a validação local.
- [ ] **Entrega Android.** O projeto EAS é `@colvindiegoss-team/cena`, slug `cena`, projectId `20f42d9f-0388-4563-8601-f6c579bbbafb`. A branch `manus-cenacopy-preview` é isolada; `feat/native-first-app-commerce` não foi alterada. O `main` agora contém o backend no commit `ea2ca9f`; o site publicado e o APK anterior permanecem intactos. O perfil EAS `preview` aponta à API principal, mas o novo APK fica pendente até a publicação do backend.

## Login Manus e upload — código desta solicitação

- [x] **Cliente Manus nativo preparado.** O Android abre o navegador do sistema, valida `state`, troca código OAuth somente no servidor, recebe apenas ticket opaco, curto e de uso único no deep link e troca o ticket por sessão Bearer. A sessão é validada pela API e armazenada no `SecureStore`. Não há código OAuth, segredo ou JWT em URL/deep link, nem associação automática por e-mail.
- [x] **Fluxo de envio preparado.** Seleciona áudio MP3, WAV, M4A ou OGG até 50 MB; capa opcional JPG, JPEG, PNG ou WebP até 10 MB; exige perfil artístico, título e declaração de direitos; preserva álbum, gênero, cidade, descrição, tipo/data de lançamento, visibilidade, créditos e coletivo apenas quando a conta tem permissão `owner`/`editor`. Reutiliza `/api/upload`, storage oficial e `scene.createTrack` existentes.
- [x] **Falhas de resposta protegidas.** Se a resposta de `scene.createTrack` for incerta, o app mantém os arquivos e reaproveita a mesma chave e URLs ao tentar novamente sem mudar o formulário; só solicita limpeza após falha antes da mutation ou confirmação explícita de que nada foi persistido. Se o app fechar durante a operação, conferir no site antes de iniciar outra tentativa.
- [x] **Backend preparado e enviado a GitHub main.** Commit `ea2ca9f` adiciona rotas OAuth nativas, validação de nonce/state, tickets hashed de curta validade e uso único, troca por sessão, e migration aditiva `drizzle/0015_mobile_oauth_tickets.sql`. A verificação local de `pnpm check`, `pnpm test` (29 passaram; 2 ignorados) e `pnpm build` foi concluída. A migration ainda não foi executada na base publicada.
- [ ] **Checkpoint e publicação do backend no projeto principal.** O histórico do projeto `wdp_694` ainda mostra o checkpoint `6e6bfbe` de 8 de novembro; o push externo ao repositório GitHub não criou um novo checkpoint Manus. A sessão atual está vinculada à cópia Webdev `wdp_946`, e o `wdp_694` está disponível apenas como painel incorporado de leitura. Até criar/aceitar um novo checkpoint e publicá-lo no projeto principal, login e upload não estão operacionais de ponta a ponta. Não executar DDL na base errada.

## Verificação e bloqueios

- [x] `pnpm check`, `pnpm test` e `pnpm build` executados em `/home/ubuntu/cena-main`; nenhum login real, upload, mutation ou gravação foi executado. O APK anterior permanece disponível e não foi substituído.
- [x] **Backend atualizado em GitHub main.** O commit `ea2ca9f` foi enviado por fast-forward a `main`; `feat/native-first-app-commerce` permaneceu no SHA `7268059`. O workflow do GitHub Pages não foi disparado pelo commit com `[skip ci]`.
- [x] **Configuração de API Android atualizada na branch isolada.** O perfil EAS `preview` e `.env.example` usam `https://cena-kn4vk68m.manus.space`; esquema nativo `cena` e identificadores Expo foram preservados. Commit `74fbdd4` enviado à branch `manus-cenacopy-preview`; nenhuma build nova foi iniciada.
- [ ] **Gerar o APK Android final.** A nova build EAS `preview` não foi iniciada porque o backend ainda não está publicado no domínio principal; gerar antes disso produziria um APK que não permite validar login/upload. Após o checkpoint e publicação do backend, gerar a build Android APK no Expo/EAS e validar no aparelho.

## Trabalho visual e de descoberta previamente aprovado

- [x] Paleta escura e cores CENA aprovadas, texto creme/lavanda.
- [x] Busca e filtro de gênero aceitam digitação livre, com debounce e preservação dos resultados enquanto atualiza.
- [x] Exemplo/configuração da API atualizado para `https://cena-kn4vk68m.manus.space`.
