# Análise completa do Cena

**Data:** 5 de novembro de 2026
**Escopo:** produto, experiência, diferenciação, comparação competitiva, arquitetura, segurança, operação e roadmap.

## Diagnóstico principal

O Cena tem uma direção visual forte e uma proposta clara: aproximar descoberta musical, artistas independentes e shows locais. A interface já comunica identidade, cidade e movimento de cena melhor do que um catálogo genérico. O backend, o banco, o storage, o OAuth e a publicação pública também estão funcionando.

O principal problema não é falta de telas. É falta de profundidade nos ciclos que fazem uma plataforma musical sobreviver: descoberta que aprende, perfil de artista que converte, evento que vira presença, playlist que gera colaboração e dados que ajudam o artista a tomar decisões.

Hoje o Cena funciona muito bem como **protótipo navegável de uma cena local**. Para virar produto, precisa deixar de depender de seed, criar entidades reais para artistas, implementar links permanentes e transformar ações demonstrativas em objetos persistentes.

## As três referências mais úteis

Não existe um único concorrente que reúna exatamente música local, artistas independentes e agenda de shows. Por isso, a comparação usa três líderes de categorias que o Cena precisa combinar.

### Spotify: referência em descoberta e crescimento de audiência

O Spotify for Artists combina perfil, vídeos, pré-lançamento, venda de ingressos e merchandising com dados de audiência. A própria plataforma destaca segmentos de público, conversão de ouvintes, dados de playlists e ferramentas de campanha [1].

O Discovery Mode mostra o nível de sofisticação esperado de uma plataforma madura: o artista sinaliza faixas prioritárias, o algoritmo usa esse sinal junto com o comportamento do ouvinte e mede o efeito sobre ouvintes, salvamentos e adições em playlists [2].

**O que o Cena deve aprender:**

- transformar cada reprodução, salvamento, follow e presença em evento em sinal de recomendação;
- mostrar ao artista não só quantas pessoas ouviram, mas quem voltou, de qual cidade veio e qual ação tomou;
- criar uma jornada de lançamento, em vez de apenas um formulário de upload;
- conectar faixa, perfil, evento e venda de ingresso numa mesma página.

**O que não deve copiar:** tentar competir nacionalmente em catálogo e volume. A vantagem do Cena é contexto local e proximidade, não escala global.

### SoundCloud: referência em cultura independente e relação com fãs

O SoundCloud for Artists reúne upload, distribuição, insights, promoção e monetização. Também trabalha com metadados, ISRC, direitos, colaboradores e divisão de receita [3]. Isso é importante porque mostra que uma plataforma para independentes precisa tratar a faixa como um ativo profissional, e não apenas como um arquivo de áudio.

A ferramenta Fans do SoundCloud transforma sinais como reproduções repetidas, comentários e compartilhamentos em uma lista priorizada de fãs para relacionamento individual. A plataforma limita o contato para evitar spam e posiciona a ferramenta como relacionamento 1:1, não disparo em massa [4].

**O que o Cena deve aprender:**

- incluir comentários, reações e compartilhamentos com contexto;
- criar um painel de fãs próximos para o artista;
- registrar créditos, colaboradores, versão, conteúdo explícito e declaração de direitos;
- permitir apoio ao artista, venda de produtos ou contribuição futura;
- preservar a sensação de comunidade, sem transformar tudo em ranking algorítmico.

**O que o Cena pode fazer melhor:** ser muito mais local. Um artista de Campinas deve conseguir encontrar ouvintes, venues, produtores e outros artistas da própria região, algo que uma plataforma global não prioriza.

### Bandsintown: referência em conversão de interesse em show

O Bandsintown for Artists é focado no ciclo de shows. Seus recursos incluem promoção geolocalizada, integração com Facebook, gestão de múltiplos artistas, analytics para decidir cidades e roteiros, links de ingresso e widgets para sites [5].

**O que o Cena deve aprender:**

- tratar “Tenho interesse” como começo de uma jornada, não como um botão isolado;
- enviar lembretes de anúncio, mudança de horário, ingressos e pós-show;
- mostrar onde existe concentração real de fãs antes de o artista criar uma data;
- oferecer uma página compartilhável do evento com ingresso, mapa, horário, acessibilidade e informações práticas;
- permitir que venues e produtores participem da rede.

**O que o Cena pode fazer melhor:** conectar a descoberta da faixa ao show local. O usuário deveria ouvir uma música, seguir o artista, ver que ele toca a 2 km dali e marcar presença sem sair da experiência.

## O que está bom hoje

### Identidade e linguagem

A direção “Noite neon da cena local” é coerente. Ameixa escuro, lima elétrica, coral, lavanda, cartões de evento e linguagem como “A cidade tem som novo” diferenciam o produto de um clone visual de Spotify.

A marca também tem uma promessa compreensível: “o som da sua cidade, feito por quem vive nela”. Essa frase deve permanecer como eixo de produto e comunicação.

### Arquitetura inicial

O projeto usa React, Express, tRPC, Drizzle e banco gerenciado. O schema já possui usuários, artistas, faixas, eventos, playlists, relações de playlist, follows, interesses e reproduções. Há índices razoáveis para cidade/gênero, artista, data de evento e reprodução.

O storage usa URLs presigned, o que evita transferir arquivos grandes pelo servidor. O backend público, o banco e o storage foram validados na URL publicada. O build e os testes existentes também passam.

### Player persistente e agenda

A decisão de manter o player enquanto o usuário navega é correta. A agenda também é uma boa escolha de diferenciação, pois cria uma ação concreta fora do consumo passivo de música.

## Problemas prioritários encontrados

### P0 — o aplicativo ainda mistura produto real com demonstração

O endpoint de discovery tenta consultar o banco, mas se as três consultas retornarem vazias ele devolve o seed inteiro como fallback. Isso cria um problema grave: uma busca sem resultados, uma cidade sem conteúdo ou uma falha de dados pode aparecer como se houvesse conteúdo real. O usuário não sabe se está vendo dados reais ou demonstração.

**Por que isso importa:** confiança. Um artista pode acreditar que publicou algo, enquanto outro usuário continua vendo dados fictícios. A operação também perde observabilidade.

**Mudança recomendada:** separar três estados explícitos:

1. banco indisponível;
2. banco disponível sem resultados;
3. banco com resultados.

O seed deve aparecer apenas em modo de demonstração identificado visualmente, nunca como fallback silencioso em produção.

### P0 — não existe criação de perfil de artista

O usuário pode escolher “Artista / banda”, mas upload e criação de evento exigem que exista uma linha na tabela `artists`. O código tenta encontrar o artista pelo `ownerId` e retorna “Crie seu perfil de artista antes...”, porém não há um fluxo completo de criação desse perfil.

**Por que isso importa:** o caminho mais importante para o lado da oferta termina antes do primeiro conteúdo. Um artista novo consegue escolher o papel, mas não consegue publicar.

**Mudança recomendada:** depois de escolher “Artista / banda”, abrir onboarding com nome artístico, handle, cidade, gênero, bio, avatar, capa e links. Criar o perfil antes de mostrar o dashboard de publicação.

### P0 — links compartilháveis não são permanentes

O compartilhamento usa `window.location.href`. O perfil de artista selecionado, evento e faixa não possuem rotas próprias. Ao compartilhar, o destinatário recebe `/perfil`, `/eventos` ou a página atual, sem necessariamente chegar à entidade que originou o compartilhamento.

**Por que isso importa:** música local cresce por WhatsApp, Instagram e grupos. Se o link não abre exatamente a faixa, artista ou show, o principal canal de aquisição quebra.

**Mudança recomendada:** criar rotas permanentes:

- `/artistas/:handle`;
- `/faixas/:id`;
- `/eventos/:id`;
- `/playlists/:id`.

Adicionar título, imagem de compartilhamento, descrição e canonical por rota. Isso também melhora indexação de shows locais.

### P0 — playlist colaborativa ainda não é colaborativa

O banco armazena `collaborative`, mas o produto apenas cria a playlist. Não há adicionar faixa, remover faixa, ordenar faixas, convidar colaborador ou verificar permissão.

**Por que isso importa:** o texto promete que “outras pessoas podem adicionar faixas”. Hoje essa promessa não corresponde ao comportamento.

**Mudança recomendada:** implementar `playlistTracks`, adicionar/remover faixa, posição, token ou link de convite, permissões e histórico de alterações. Se a função ainda não estiver pronta, remover “colaborativa” da interface até estar funcional.

### P0 — busca não cobre todos os tipos prometidos

A interface promete busca por artista, faixa, gênero e cidade. A consulta de faixas pesquisa título, álbum, gênero e cidade, mas não o nome do artista. Também não pesquisa handle. Isso faz uma busca por “Lume Azul” falhar mesmo que existam faixas desse artista.

**Mudança recomendada:** incluir `artists.name` e `artists.handle` no join da busca, normalizar acentos e retornar o tipo de resultado. Mostrar grupos separados: faixas, artistas, eventos e playlists.

### P1 — cidade é fixa e o produto não cumpre plenamente a promessa local

`activeCity` está fixado em “Campinas”. O chip de localização parece interativo, mas não há seleção real de cidade, detecção de localização, cidades recentes ou explicação de como trocar.

**Por que isso importa:** cidade é o principal diferencial do Cena. Uma cidade fixa transforma a tese local em uma decoração.

**Mudança recomendada:** criar onboarding de cidade, seletor funcional, opção “usar localização aproximada” e fallback explícito. Começar por Campinas, mas modelar múltiplas cidades desde já.

### P1 — estado de usuário aparece para visitantes

O frontend inicializa `followed` com `[2]` e `interested` com `[1]`. Assim, um visitante pode ver “Seguindo” ou “Você vai” sem ter entrado na conta.

**Mudança recomendada:** estado anônimo deve começar vazio. Se o objetivo for demonstração visual, usar um modo demo claramente identificado e não misturá-lo à experiência pública.

### P1 — eventos persistentes não têm contagem real de interesse

Os eventos vindos do banco recebem `interest: 0`. O sistema registra interesses, mas não agrega a contagem para o card. A agenda também lista eventos passados porque a consulta não filtra `eventDate >= agora`.

**Mudança recomendada:** retornar contagem agregada, separar próximos e encerrados, oferecer “Adicionar ao calendário” e permitir atualização de data/horário.

### P1 — o upload deixa arquivos órfãos e não tem pipeline editorial

O fluxo envia o áudio, envia a capa e só depois cria a faixa. Se a etapa final falhar, os arquivos já estão no storage sem registro no banco. Também não há progresso, cancelamento, retry, extração de duração, transcodificação, waveform, moderação ou verificação de conteúdo.

A API valida extensão e tamanho declarados, mas o endpoint de criação de faixa aceita `audioUrl` e `coverUrl` opcionais. Um cliente poderia chamar a API diretamente com URLs arbitrárias.

**Mudança recomendada:**

- criar uma sessão de upload com status;
- validar MIME real e extensão no servidor;
- associar cada objeto a usuário e sessão;
- confirmar o upload antes de publicar;
- remover órfãos por rotina;
- extrair duração e waveform;
- manter faixa como `draft`, `processing`, `published` ou `rejected`;
- aceitar só URLs de storage pertencentes ao artista;
- adicionar denúncia, retirada por direitos autorais e revisão.

### P1 — áudio seed usa arquivos externos de demonstração

As faixas seed apontam para SoundHelix. Isso é útil para prototipar o player, mas não representa artistas locais reais e cria risco de dependência externa, indisponibilidade ou confusão sobre direitos.

**Mudança recomendada:** substituir por áudios próprios licenciados ou por um pacote de demonstração explicitamente identificado. Em produção, o catálogo deve tocar apenas arquivos cuja origem e direitos estejam registrados.

### P1 — o algoritmo ainda não é um algoritmo

A descoberta atual é filtro por cidade, gênero e texto. Isso é um bom MVP, mas não aprende com reprodução completa, salvamento, follow, skip, interesse em evento ou proximidade.

**Mudança recomendada em etapas:** começar com uma pontuação explicável:

`relevância local + novidade + afinidade de gênero + ouvintes recorrentes + proximidade temporal do show`.

Depois adicionar testes A/B e recomendações personalizadas. Não começar com IA opaca antes de haver eventos de produto confiáveis.

### P1 — biblioteca está incompleta

A biblioteca retorna follows, interesses e playlists, mas não há faixas salvas, histórico, playlists com suas faixas, lançamentos de artistas seguidos ou notificações. O texto do produto promete uma área de atividade mais ampla do que a implementação atual entrega.

**Mudança recomendada:** implementar salvos, histórico recente, lançamentos seguidos, shows salvos e notificações agrupadas. A biblioteca deve responder à pergunta “o que eu não quero perder?”.

### P2 — identidade do visitante parece falsa

O visitante aparece como “Mariana” com avatar “M”. Isso pode ter vindo do mock visual, mas transmite uma conta existente e pode gerar confusão.

**Mudança recomendada:** usar “Você” ou “Entrar na Cena” para visitantes. Reservar nomes e avatares para usuários autenticados.

### P2 — o layout é forte, mas pesado no mobile

A captura mobile mostra uma composição atraente, porém o player fixo e a navegação inferior ocupam uma grande área da tela. O player pode cobrir conteúdo, especialmente em listas longas. Os filtros horizontais também ficam truncados e dependem de rolagem que nem sempre é evidente.

**Mudança recomendada:** usar mini-player recolhido por padrão, expandir por gesto/toque, preservar a área segura do Android e deixar claro que os chips são roláveis. Testar com 320 px, 375 px, 412 px e fonte aumentada.

### P2 — acessibilidade ainda precisa de auditoria real

Há alguns `aria-labels` em botões de ícone, mas não há evidência de auditoria de foco, teclado, leitor de tela, contraste, tamanho mínimo de toque e estados de erro. A cor lima não deve ser o único indicador de estado.

**Mudança recomendada:** adicionar foco visível, nomes acessíveis, estados `aria-pressed`, mensagens de erro associadas a campos, contraste WCAG AA e teste com TalkBack no APK.

## Arquitetura recomendada para a próxima fase

### Entidades que faltam

Adicionar ou completar:

- `artistProfiles` com status de publicação e verificação;
- `venues` e `organizers`;
- `eventOccurrences` para recorrência e alterações;
- `savedTracks`;
- `playlistInvites` e `playlistActivity`;
- `notifications`;
- `releaseDrafts` ou `uploadSessions`;
- `reports`, `takedowns` e `moderationCases`;
- `artistStatsDaily` para métricas agregadas;
- `cityMemberships` ou preferência de cidade.

### API

Separar claramente procedimentos públicos, autenticados e administrativos. Adicionar paginação por cursor para discovery, eventos e biblioteca. Retornar estados de domínio em vez de `persisted: false` silencioso. Implementar rate limit em login, busca, play tracking, upload-presign e compartilhamentos.

### Storage

Manter upload direto por presigned URL, mas registrar uma sessão antes do upload e confirmar depois. Criar política de expiração para objetos órfãos. Gerar versões de capa em tamanhos diferentes e uma waveform do áudio para o player.

### Observabilidade

Registrar erros de API com request id, duração, procedimento tRPC e usuário anônimo/autenticado. Criar métricas de funil: primeira reprodução, reprodução de 30 segundos, follow, salvamento, interesse em evento, clique no ingresso e retorno em sete dias.

## Roadmap recomendado

### Fase 1 — confiabilidade do MVP

Corrigir fallback silencioso, criar onboarding de artista, corrigir busca por artista, remover estado falso do visitante, filtrar eventos passados e criar rotas permanentes de faixa, artista e evento.

**Por que primeiro:** sem isso, o produto pode parecer bom numa demonstração e falhar no primeiro uso real. São correções que aumentam confiança antes de adicionar mais recursos.

### Fase 2 — ciclo completo de artista

Implementar upload com sessão e processamento, perfil editável, criação de faixa, álbum/EP, créditos, direitos, capa, waveform, draft/publicação e painel básico de audiência.

**Por que depois:** o Cena precisa de oferta real. Sem artistas publicando e entendendo o resultado, não existe catálogo vivo.

### Fase 3 — ciclo completo de show

Criar venue, evento permanente, mapa, calendário, ingresso, contagem de interesse, lembretes, compartilhamento e atualização automática de mudanças.

**Por que depois:** eventos são a maior diferenciação contra serviços de streaming. Eles devem sair de uma lista e virar conversão local.

### Fase 4 — comunidade e retenção

Adicionar salvamentos, comentários ou reações moderadas, playlists realmente colaborativas, feed de lançamentos seguidos, notificações e recomendações explicáveis.

**Por que depois:** comunidade só funciona quando existe conteúdo persistente suficiente e mecanismos de segurança.

### Fase 5 — sustentabilidade

Testar apoio ao artista, promoção local transparente, parcerias com venues, planos para organizadores e serviços de dados para artistas. Evitar anúncios invasivos, pois “sem anúncios” é parte da promessa de marca.

## Métricas que devem orientar as decisões

A métrica principal não deve ser apenas reproduções. Para o Cena, a melhor métrica de valor é **ouvintes locais que realizam uma segunda ação**, como seguir o artista, salvar a faixa ou demonstrar interesse em um show.

Acompanhar:

- porcentagem de novos usuários que dão play em até 60 segundos;
- porcentagem que escuta pelo menos 30 segundos;
- follows por 100 ouvintes;
- salvamentos por faixa;
- interesse em evento por artista seguido;
- cliques de ingresso por evento;
- retorno em 7 e 30 dias;
- artistas que publicam uma segunda faixa;
- tempo entre upload e primeira escuta;
- taxa de upload concluído sem arquivo órfão;
- proporção de conteúdo real contra seed.

## Decisão estratégica

O Cena não deve tentar ser “um Spotify menor”. Spotify vence em catálogo, personalização global, campanhas e escala. SoundCloud vence em cultura de upload, experimentação e ferramentas para independentes. Bandsintown vence em agenda, alertas e operação de turnês.

A posição mais forte para o Cena é: **a camada local que transforma descoberta musical em presença na cidade**. A plataforma deve responder, em poucos segundos, a três perguntas:

1. O que está surgindo perto de mim?
2. Quem faz esse som e como posso acompanhar?
3. Onde posso encontrar essa pessoa ao vivo?

Se essas três respostas forem rápidas, confiáveis e compartilháveis, o Cena terá uma vantagem que os três concorrentes não entregam juntos.

## Referências externas

[1]: https://artists.spotify.com/ "Spotify for Artists — ferramentas para audiência, campanhas, perfil e eventos"

[2]: https://artists.spotify.com/discovery-mode "Spotify Discovery Mode — recomendações e promoção orientadas por sinal do artista"

[3]: https://help.soundcloud.com/hc/en-us/articles/360051799993-Anatomy-of-SoundCloud-for-Artists "SoundCloud for Artists — upload, distribuição, insights, monetização e fãs"

[4]: https://help.soundcloud.com/hc/en-us/articles/14905984226331-Using-the-Fans-Tool "SoundCloud Fans Tool — engajamento e relacionamento com fãs"

[5]: https://www.artists.bandsintown.com/support/index-features "Bandsintown for Artists — promoção, analytics, ingressos e turnês"

## Evidências internas do projeto

- [Router tRPC do Cena](/home/ubuntu/cena/server/routers.ts)
- [Consultas do banco](/home/ubuntu/cena/server/db.ts)
- [Schema Drizzle](/home/ubuntu/cena/drizzle/schema.ts)
- [Tela principal e player](/home/ubuntu/cena/client/src/pages/Home.tsx)
- [Estilos responsivos](/home/ubuntu/cena/client/src/index.css)
- [Rotas declaradas](/home/ubuntu/cena/client/public/manus-routes.json)
