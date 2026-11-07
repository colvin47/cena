# Análise funcional do CENA.

**Data:** 6 de novembro de 2026
**Escopo:** experiência de ouvintes, experiência de artistas, fluxos persistentes, confiança, conversão, comunidade e prioridades de produto.

## 1. Diagnóstico executivo

O Cena já tem uma base convincente de produto: identidade própria, descoberta local, player persistente, agenda, follows, interesses, login real, banco, storage e um fluxo inicial de perfil artístico. A proposta é clara: aproximar o ouvinte do som e dos shows da própria cidade.

O principal problema atual não é falta de telas. É que alguns caminhos parecem completos visualmente, mas ainda não fecham o ciclo funcional. O ouvinte consegue descobrir e tocar, porém ainda não consegue salvar faixas nem receber uma atividade realmente personalizada. O artista consegue criar um perfil e iniciar um upload, porém ainda não tem um painel de publicação, edição, métricas, revisão ou confirmação clara de que seu conteúdo está no ar. A playlist colaborativa tem estrutura e permissão no backend, mas ainda não possui uma ação visível para adicionar faixas.

Minha avaliação geral do estado atual:

| Área | Estado atual | Avaliação |
|---|---|---|
| Identidade e navegação | Implementada | Forte e diferenciada |
| Descoberta inicial | Implementada | Boa para demonstração; ainda pouco personalizada |
| Player | Implementado | Bom MVP; fila ainda é implícita |
| Conta e papéis | Implementada | Login e escolha de papel funcionam |
| Perfil de artista | Parcialmente implementado | Falta edição, imagem, links e dashboard |
| Upload | Parcialmente implementado | Falta pipeline confiável e feedback de processamento |
| Agenda | Parcialmente implementada | Falta detalhe próprio, calendário, edição e notificações |
| Biblioteca | Parcialmente implementada | Follows e playlists existem; salvamentos e atividade ainda faltam |
| Playlists colaborativas | Backend inicial | A promessa ainda não está utilizável pela interface |
| Compartilhamento | Parcial | Perfil tem rota; faixa e evento ainda não têm destino próprio |
| Dados e confiança | Parcial | Modo demo é identificado, mas existem inconsistências de cidade e seed |

## 2. Experiência do ouvinte

### O que funciona bem

1. **A proposta é entendida rapidamente.** A Home explica que o produto é local e conecta descoberta a agenda.
2. **O player permanece durante a navegação.** Isso evita interromper o consumo ao mudar de seção.
3. **O ouvinte consegue filtrar por gênero, cidade e texto.** O filtro de cidade já existe e dispara uma nova consulta.
4. **Follow e interesse em eventos são ações claras.** O estado anônimo começa vazio e, para usuários autenticados, é sincronizado com a biblioteca.
5. **A agenda tem filtros por cidade e período.** O backend remove eventos passados e agrega o número de interesses.
6. **A linguagem visual é adequada ao público.** O produto não parece um painel administrativo e mantém a sensação de cena local.

### Gargalos funcionais do ouvinte

#### 2.1 A troca de cidade ainda é inconsistente

O seletor de cidade existe, mas o conteúdo seed não respeita completamente a cidade escolhida. No backend, as faixas seed filtram cidade, mas artistas seed não filtram cidade e eventos seed são devolvidos sem filtro de cidade. Além disso, o hero continua exibindo “AO VIVO EM CAMPINAS” e “CAMPINAS, SP” mesmo quando o usuário seleciona São Paulo ou Jundiaí.

**Impacto:** o diferencial principal do Cena perde credibilidade. O usuário escolhe uma cidade, mas continua vendo sinais de outra.

**Melhoria recomendada:** criar uma única função de contexto de cidade e aplicá-la a faixas, artistas, eventos, título, ticker e textos. Quando uma cidade não tiver conteúdo, mostrar explicitamente “Ainda estamos chegando nesta cidade”, em vez de misturar conteúdo de Campinas.

#### 2.2 A busca ainda não é uma busca de produto completa

A busca por faixa inclui o nome e o handle do artista no banco, mas a interface ainda apresenta apenas grupos de faixas e artistas. Eventos e playlists não aparecem como tipos de resultado. Também não há normalização de acentos, ordenação por relevância ou indicação da cidade do resultado além de pequenos metadados.

**Melhoria recomendada:** retornar resultados agrupados por tipo: Artistas, Faixas, Eventos e Playlists. Priorizar correspondência exata de nome/handle, depois prefixo e depois texto parcial. Destacar por que o resultado apareceu: “artista de Campinas”, “show em 3 dias” ou “faixa do gênero selecionado”.

#### 2.3 O ouvinte não consegue salvar uma faixa

Hoje existe follow de artista, interesse em evento e playlist, mas não existe uma entidade de faixa salva. O usuário que gostou de uma música precisa lembrar onde a encontrou ou adicioná-la a uma playlist por um fluxo ainda inexistente.

**Melhoria recomendada:** adicionar “Salvar faixa” e uma seção “Faixas salvas” na Biblioteca. O botão deve funcionar para visitante em modo local temporário ou pedir login no momento de persistir, sem perder a ação que acabou de ser feita.

#### 2.4 A biblioteca promete mais do que entrega

A área mostra atividade seed, playlists e artistas seguidos. A atividade não é construída a partir dos artistas reais seguidos pelo usuário. Também não há histórico recente, lançamentos novos dos artistas seguidos, faixas salvas ou lembretes de eventos.

**Melhoria recomendada:** dividir a Biblioteca em quatro blocos úteis:

- Continuar ouvindo;
- Faixas salvas;
- Artistas seguidos e novos lançamentos;
- Shows de interesse e próximos lembretes.

A atividade seed deve aparecer apenas no modo demo. Em conta real sem atividade, mostrar uma orientação concreta, como “Siga um artista para receber novidades aqui”.

#### 2.5 O compartilhamento não leva à entidade correta

O compartilhamento ainda usa a URL atual. O perfil de artista já possui a rota `/artistas/:handle`, mas faixas e eventos continuam compartilhando a página em que o usuário está. Isso é especialmente problemático para compartilhamento por WhatsApp, porque o destinatário pode abrir a Home ou uma agenda genérica.

**Melhoria recomendada:** criar e usar rotas:

- `/artistas/:handle`;
- `/faixas/:id`;
- `/eventos/:id`;
- `/playlists/:id`.

Cada rota deve carregar título, descrição, imagem, cidade, data e CTA apropriado. Para evento, o CTA principal deve ser “Tenho interesse” ou “Comprar ingresso”. Para faixa, “Ouvir agora”.

#### 2.6 A fila do player ainda é implícita

O player toca a sequência atual de `content.tracks`, mas não há fila visível, adicionar à fila, remover, reordenar ou “tocar depois”. A promessa de fila existe na direção do produto, mas a funcionalidade ainda é apenas próxima/anterior.

**Melhoria recomendada:** criar uma fila mínima com:

- “Adicionar à fila” em cada faixa;
- painel da fila no player;
- remover item;
- próxima faixa claramente identificada;
- preservação da fila ao navegar.

Também é importante tratar o caso em que o resultado da busca está vazio para não calcular próximo/anterior sobre uma lista de tamanho zero.

#### 2.7 Falta retenção pós-evento

“Tenho interesse” é um bom início, mas não há adicionar ao calendário, lembrete, atualização de horário, confirmação de ingresso ou mensagem pós-show.

**Melhoria recomendada:** transformar interesse em uma sequência: confirmação imediata, lembrete 24 horas antes, aviso de alteração e pergunta pós-evento. Para o MVP, o primeiro passo pode ser apenas exportar `.ics` e oferecer um lembrete interno.

## 3. Experiência do artista ou banda

### O que funciona bem

1. **O papel de artista é explícito.** O usuário entende que existe uma experiência diferente de ouvinte.
2. **O onboarding inicial já cria a entidade real.** Nome, handle, cidade, gênero e bio são persistidos.
3. **O backend verifica o proprietário do perfil.** Upload e criação de evento não dependem apenas do estado visual do frontend.
4. **Os arquivos usam storage presigned.** O áudio não precisa atravessar o servidor de aplicação.
5. **A criação de evento valida o perfil artístico.** Isso evita eventos órfãos sem artista.
6. **A proteção de upload melhorou.** Há limite de tamanho, extensão, MIME e prefixo de storage por usuário.

### Gargalos funcionais do artista

#### 3.1 O onboarding ainda é pequeno demais

O perfil inicial não coleta avatar, capa, Instagram, Bandcamp, links de contato, integrantes, gênero secundário ou cidade de atuação. O schema possui vários desses campos, mas o formulário não os utiliza.

**Impacto:** o perfil pode ser criado, mas não fica pronto para divulgação. O artista ainda precisa de outro canal para explicar quem é e onde encontrar seu trabalho.

**Melhoria recomendada:** dividir em duas etapas:

- obrigatório para publicar: nome, handle, cidade, gênero e imagem principal;
- completar depois: bio, capa, Instagram, Bandcamp, integrantes, contato de booking e cidades onde toca.

Não bloquear a entrada por exigir tudo, mas mostrar um indicador “perfil 60% completo”.

#### 3.2 Não existe edição do perfil

Depois que o perfil é criado, não há fluxo de editar nome, bio, imagem, links ou cidade. Um erro de digitação no handle ou na bio exige intervenção no banco.

**Melhoria recomendada:** botão “Editar perfil” no perfil próprio, com validação de handle, preview da capa e confirmação de alterações.

#### 3.3 O upload é uma sequência de arquivos, não um lançamento

O artista envia áudio e capa e declara direitos, mas não recebe progresso por etapa, estimativa, cancelamento, retry ou status editorial. Se o upload do áudio e da capa completar, mas a criação da faixa falhar, podem sobrar objetos no storage.

**Melhoria recomendada:** criar uma sessão de upload com estados:

`draft → uploading → processing → published` ou `rejected`.

A tela deve informar claramente:

- áudio enviado;
- capa enviada;
- metadados validados;
- direitos declarados;
- faixa publicada ou aguardando processamento.

Também deve haver uma rotina de limpeza de objetos órfãos.

#### 3.4 A duração da faixa não é extraída automaticamente

O formulário envia o arquivo, mas não existe pipeline para extrair duração, validar áudio real, gerar waveform ou preparar formatos de reprodução. A duração pode ficar zerada ou depender de dado enviado pelo cliente.

**Melhoria recomendada:** após o upload, extrair duração no backend ou em worker confiável, gerar waveform simples e impedir publicação quando o arquivo não for decodificável.

#### 3.5 O artista não tem dashboard

O artista não consegue responder perguntas básicas:

- Quantas pessoas ouviram minha faixa?
- Quantos seguidores vieram da cidade?
- Qual faixa levou pessoas ao meu evento?
- Quantos interessados há no show?
- Quantas vezes o link foi compartilhado?

O banco já registra reproduções, follows e interesses, mas não existe uma tela de métricas.

**Melhoria recomendada:** começar com um dashboard simples, sem algoritmo opaco:

- reproduções nos últimos 7/30 dias;
- ouvintes únicos aproximados;
- seguidores ganhos;
- interesses por evento;
- cidades com maior atividade;
- faixas mais tocadas.

#### 3.6 A agenda não tem gestão pós-publicação

O artista cria evento, mas não edita, cancela, altera horário ou visualiza interessados. O backend aceita criação, mas o ciclo de vida do evento termina no insert.

**Melhoria recomendada:** implementar “Meus eventos” com editar, cancelar, duplicar evento, atualizar ingresso e enviar aviso aos interessados. Eventos cancelados devem permanecer visíveis com status claro, não desaparecer silenciosamente.

#### 3.7 O artista não controla a relação com fãs

O follow existe do lado do ouvinte, mas não existe uma visão para o artista sobre seguidores, cidades, ouvintes recorrentes, comentários ou mensagens. Isso reduz o valor do Cena para quem publica.

**Melhoria recomendada:** começar com dados agregados e privacidade preservada: quantidade de seguidores, cidades principais e ouvintes recorrentes. Depois, adicionar comentários moderados e reações, evitando abrir contato direto sem proteção contra spam.

## 4. Comunidade e playlists

A estrutura de `playlistTracks`, posição, proprietário e flag `collaborative` já existe no banco. Também existe endpoint para adicionar faixa respeitando a permissão. Porém, a interface ainda não expõe uma ação para escolher uma playlist e adicionar uma faixa. Também não há link de convite, remoção, ordenação, histórico ou visualização detalhada da playlist.

Isso cria uma divergência importante: o produto comunica “outras pessoas podem adicionar faixas”, mas o usuário não encontra como fazer isso.

### Ordem recomendada para fechar o recurso

1. Criar rota `/playlists/:id`.
2. Exibir faixas e ordem da playlist.
3. Adicionar botão “Adicionar à playlist” em cada TrackRow.
4. Abrir seletor das playlists do usuário.
5. Se colaborativa, gerar link de convite ou link de edição controlado.
6. Permitir remover e reordenar pelo proprietário.
7. Registrar `addedBy` e atividade básica.
8. Mostrar aviso quando a faixa já estiver na playlist.

Se o link colaborativo ainda não estiver pronto, o rótulo deve ser “playlist compartilhável em breve” ou a interface não deve prometer colaboração completa.

## 5. Problemas transversais de experiência

### 5.1 Estados de erro e sucesso são insuficientes

Há toasts úteis, mas ações críticas como upload, criação de evento e criação de perfil precisam de estados persistentes no próprio formulário. Toast sozinho pode desaparecer antes que o usuário entenda o que ocorreu.

**Melhoria:** usar mensagens inline junto aos campos, estado de carregamento no botão, bloqueio contra duplo envio e resumo final da operação.

### 5.2 Acessibilidade ainda não está no nível de produto

Existem alguns `aria-labels`, mas faltam `aria-pressed` em follow/interesse, foco visível consistente, associação de erros aos campos, estados de carregamento acessíveis e teste com TalkBack no Android. O select de cidade também precisa manter contraste e foco perceptível.

**Melhoria:** fazer uma rodada WCAG AA e testar pelo menos teclado, leitor de tela, fonte aumentada e viewport de 320 px.

### 5.3 Player fixo pode cobrir conteúdo no mobile

Player e navegação inferior ocupam uma área relevante. Em listas longas, o último item pode ficar atrás do player. O produto precisa de área segura real, especialmente no APK/WebView.

**Melhoria:** mini-player recolhido por padrão, expansão ao tocar, `padding-bottom` calculado para player + navegação e teste em Android pequeno.

### 5.4 Conteúdo demo e conteúdo real precisam de regras mais claras

O indicador de modo demo foi uma boa correção, mas ainda existe risco de inconsistência: o seed pode aparecer enquanto o banco possui alguns dados reais, e a experiência não explica por que uma cidade sem dados mostra conteúdo de demonstração.

**Melhoria:** apresentar três estados no contrato de discovery:

- `unavailable`: banco/storage indisponível;
- `empty`: banco disponível sem resultados;
- `demo`: seed habilitado explicitamente;
- `live`: conteúdo persistido.

No modo `empty`, mostrar convite para artistas publicarem, não substituir silenciosamente por Campinas.

## 6. Roadmap recomendado

### Fase 1 — Fechar confiança e conversão básica

Prioridade máxima para a próxima entrega:

1. Corrigir cidade seed em artistas e eventos.
2. Corrigir textos do hero para a cidade selecionada.
3. Criar rotas próprias de faixa e evento.
4. Fazer compartilhamento apontar para a entidade original.
5. Adicionar salvar faixa.
6. Criar tela de detalhe de playlist.
7. Expor “Adicionar à playlist” na faixa.
8. Adicionar edição de perfil de artista.
9. Adicionar feedback inline para upload e eventos.

**Resultado esperado:** o ouvinte consegue descobrir, salvar, compartilhar e retornar; o artista consegue criar um perfil apresentável e corrigir seus dados.

### Fase 2 — Transformar publicação em produto para artista

1. Sessão de upload com status e retry.
2. Extração de duração e validação real do áudio.
3. Limpeza de uploads órfãos.
4. Rascunho/publicado/rejeitado.
5. Dashboard com reproduções, follows, interesses e cidades.
6. Editar/cancelar eventos.
7. Imagens de perfil/capa e links sociais.

**Resultado esperado:** publicar deixa de ser apenas enviar arquivo e passa a ser uma operação confiável.

### Fase 3 — Retenção do ouvinte e comunidade

1. Biblioteca com faixas salvas e histórico.
2. Feed real de artistas seguidos.
3. Lembretes de shows e exportação para calendário.
4. Playlists colaborativas com convite, atividade e moderação.
5. Recomendações explicáveis baseadas em cidade, gênero, novidades e comportamento.
6. Comentários ou reações com denúncia e moderação.

**Resultado esperado:** o usuário volta porque tem algo a acompanhar, não apenas porque existe uma Home bonita.

### Fase 4 — Rede local de música

1. Venues e produtores como entidades próprias.
2. Página completa de evento com mapa, acessibilidade e informações práticas.
3. Ferramentas para booking e contato.
4. Analytics por cidade para artistas.
5. Integração de ingresso e apoio ao artista.
6. Notificações com preferências e limites anti-spam.

## 7. Critérios de uma boa experiência

### Para o ouvinte

- Em até 30 segundos, entender o que existe perto dele.
- Tocar uma faixa sem interrupção ao navegar.
- Salvar uma faixa ou seguir um artista com uma ação.
- Saber se está vendo conteúdo real ou demonstração.
- Compartilhar uma faixa, artista ou show e abrir exatamente aquele item.
- Encontrar na Biblioteca tudo que decidiu não perder.
- Receber um lembrete útil, não uma sequência de notificações invasivas.

### Para o artista

- Criar um perfil apresentável em poucos minutos.
- Publicar com segurança e acompanhar o status.
- Editar informações sem depender do suporte.
- Ver se a publicação gerou ouvintes, seguidores ou interesse em show.
- Criar, atualizar e cancelar eventos.
- Compartilhar um link profissional de perfil, faixa e evento.
- Saber quais cidades e públicos estão respondendo ao trabalho.

## Conclusão

O Cena está pronto como MVP visual e demonstração navegável, mas ainda não como produto completo para operação contínua. A maior oportunidade é não adicionar dezenas de telas: é fechar os ciclos essenciais.

A ordem correta é:

1. confiança dos dados e links corretos;
2. salvar e retornar para o ouvinte;
3. perfil e publicação profissionais para o artista;
4. colaboração real em playlists;
5. métricas e retenção;
6. rede local de venues, produtores e shows.

Se essa ordem for respeitada, o Cena preserva sua diferenciação local e evita tentar copiar Spotify ou Bandsintown antes de provar o ciclo mais valioso: **descobrir um som perto, seguir quem fez, ir ao show e voltar para a cena**.


## 8. Ciclo implementado após a análise

A primeira camada de execução foi aplicada: o Cena agora possui páginas de detalhe para faixas, eventos e playlists compartilháveis; ação de adicionar faixas a playlists persistentes; estúdio do artista com edição de nome, handle, cidade, gênero, bio e links; métricas iniciais de reproduções, seguidores, interesses em eventos e faixas mais ouvidas; além de estados visíveis no upload para preparação, envio, validação e publicação.

A próxima camada deve completar gestão de eventos, histórico de reprodução, lembretes/calendário e recomendações locais. Esses itens dependem de ampliar a experiência persistente sem misturar dados seed com dados reais.


## 9. Segundo ciclo implementado

A agenda agora permite ao usuário exportar um evento para o calendário do dispositivo em formato `.ics`. Artistas autenticados passam a visualizar seus próprios eventos e podem excluí-los com confirmação. A Biblioteca ganhou a seção “Continuar ouvindo”, alimentada pelo histórico persistente de reproduções do usuário. O backend também passou a expor atualização e exclusão de eventos, além de listar eventos do artista.


## 10. Terceiro ciclo implementado

O painel de eventos do artista passou a permitir edição inline e exclusão com confirmação. O ouvinte pode adicionar eventos ao calendário, enquanto o player ganhou uma fila mínima: faixas podem ser adicionadas a uma fila persistente durante a navegação e o player exibe sua contagem. O histórico e as ações locais continuam compatíveis com o modo demonstração.


## 11. Quarto ciclo implementado

A Home passou a apresentar uma curadoria local explicável, com recomendações acompanhadas da razão “novo em [cidade]” e CTA direto para ouvir. O upload passou a tentar extrair automaticamente a duração do áudio antes de publicar. A fila ganhou painel visual para abrir, revisar e remover faixas, mantendo a contagem acessível no player.
