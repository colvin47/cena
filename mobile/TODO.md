# Resultados do CENA Mobile

## Continuidade do plano anterior

- [x] **App nativo Expo/React Native.** O CENA Mobile usa telas nativas, sem WebView; o site permanece alternativa para ouvir e gerir o catálogo. O código é mantido em branch isolada e a API é externa ao app.
- [ ] **Descoberta, busca e detalhes ligados ao catálogo CENA.** Usar as queries públicas existentes para filtrar por cidade, gênero e texto; abrir detalhes de faixa, artista e evento; distinguir carregamento, indisponibilidade, catálogo vazio e conteúdo demonstrativo. Nunca apresentar amostras como uploads reais. Requer validação depois da implantação autorizada da API.
- [ ] **Ingressos e merchandise em telas nativas.** Consultar somente `scene.eventTickets` e `scene.artistMerchandise`; mostrar preço, disponibilidade, estoque e destino externo sem checkout ou reservas. Não expor eventos/artistas ocultos nem itens indisponíveis; nenhum teste deve criar mutations ou escrever no banco compartilhado. Depende do backend e das migrations autorizadas do CENA.
- [x] **Player nativo persistente.** Reproduz a faixa selecionada, mantém controles entre telas, apresenta play/pause e progresso e não troca para uma demo por coincidência de ID ou fallback.
- [ ] **Conta, biblioteca e privacidade.** Favoritos locais permanecem privados. A sessão Manus nativa está implementada no código desta branch, mas só deverá habilitar ações autenticadas após a API validar o login e o backend receber a migration necessária; não simular login nem expor JWT em deep link.
- [ ] **Perfil artístico e publicação real.** O formulário móvel de perfil e envio está implementado no código. Para ser considerado operacional, precisa de sessão Manus validada, perfil artístico, upload de áudio/capa pelo endpoint CENA, validações de direitos, formato, tamanho, propriedade, autorização e resposta real do servidor. Não enviar arquivo real nem criar perfil real durante a validação local.
- [ ] **Entrega Android.** O projeto EAS existente é `@colvindiegoss-team/cena`, slug `cena`, projectId `20f42d9f-0388-4563-8601-f6c579bbbafb`. A branch-alvo continua `manus-cenacopy-preview`; `main`, `feat/native-first-app-commerce`, site e build anterior permanecem intocados. Não declarar APK novo antes do resultado real do build remoto `preview`.

## Login Manus e upload — código desta solicitação

- [x] **Cliente Manus nativo preparado.** O Android abre o navegador do sistema, valida `state`, troca código OAuth somente no servidor, recebe apenas ticket opaco, curto e de uso único no deep link e troca o ticket por sessão Bearer. A sessão é validada pela API e armazenada no `SecureStore`. Não há código OAuth, segredo ou JWT em URL/deep link, nem associação automática por e-mail.
- [x] **Fluxo de envio preparado.** Seleciona áudio MP3, WAV, M4A ou OGG até 50 MB; capa opcional JPG, JPEG, PNG ou WebP até 10 MB; exige perfil artístico, título e declaração de direitos; preserva álbum, gênero, cidade, descrição, tipo/data de lançamento, visibilidade, créditos e coletivo apenas quando a conta tem permissão `owner`/`editor`. Reutiliza `/api/upload`, storage oficial e `scene.createTrack` existentes.
- [x] **Falhas de resposta protegidas.** Se a resposta de `scene.createTrack` for incerta, o app mantém os arquivos e reaproveita a mesma chave e URLs ao tentar novamente sem mudar o formulário; só solicita limpeza após falha antes da mutation ou confirmação explícita de que nada foi persistido. Se o app fechar durante a operação, conferir no site antes de iniciar outra tentativa.
- [x] **Patch do backend preparado, sem execução em produção.** Inclui rotas OAuth móveis, validação de nonce/state, allowlist de schemes CENA/WebDev, ticket com hash e expiração curta, consumo atômico uma vez e troca por sessão. Inclui a migration `drizzle/0016_silly_doctor_strange.sql`; ela **não** foi aplicada a nenhum banco publicado. Código disponível no patch preparado fora desta branch WebDev.
- [ ] **Ativar a API CENA.** O repositório não publica sozinho o backend que atende `https://cenacopy-rjglbygs.manus.space`. Aplicar/deployar as rotas no projeto WebDev/servidor que realmente atende essa API e revisar/aplicar a migration apenas no banco autorizado. A branch CENA existente usa `cena://oauth/callback`; para a cópia WebDev, a allowlist precisa incluir também o scheme gerado pelo app WebDev. Sem esta ativação o login nativo ainda não funciona.

## Verificação e bloqueios

- [x] `corepack pnpm check` no app WebDev e no pacote Expo de origem; TypeScript focado nos módulos backend alterados; 6 testes puros do protocolo OAuth aprovados; no app WebDev, 39 testes passaram e 1 teste existente foi ignorado. Nenhum login real, upload, mutation ou gravação foi executado.
- [x] **Enviar código à branch isolada.** Commit `e5accb38e6a3ac6c863047304423e51bddf150c4` enviado a `manus-cenacopy-preview`; `main` e `feat/native-first-app-commerce` não foram alteradas. O perfil EAS `preview` agora especifica `android.image: latest` e continua gerando APK interno.
- [ ] **Conectar a conta GitHub pessoal ao Expo e compilar APK.** A conta `dicolvin` tem papel Admin da organização `colvindiegoss-team` e acesso ao projeto `cena`. O projeto está vinculado a `colvin47/cena` com base `/mobile`, mas em Expo > User settings > General > Connections o GitHub ainda está **Not connected**. Conectar o usuário GitHub com acesso ao repositório e aprovar o Expo GitHub App; depois escolher branch `manus-cenacopy-preview`, plataforma Android e perfil `preview` em Build from GitHub. O APK anterior é o único resultado entregue até a conclusão desse build.

## Trabalho visual e de descoberta previamente aprovado

- [x] Paleta escura e cores CENA aprovadas, texto creme/lavanda.
- [x] Busca e filtro de gênero aceitam digitação livre, com debounce e preservação dos resultados enquanto atualiza.
- [x] Exemplo/configuração da API corrigido para `https://cenacopy-rjglbygs.manus.space`.
