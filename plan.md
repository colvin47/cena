# Plano — Cena

## Escopo de implementação

O Cena será uma experiência web responsiva com linguagem de PWA, construída no starter React/Express/tRPC/Drizzle com servidor e banco gerenciados. A primeira entrega implementa o fluxo principal de descoberta regional, autenticação via Manus OAuth, player persistente, perfil de artista/banda, upload de faixa com declaração de direitos, agenda de eventos, playlists e biblioteca/atividade. A aplicação mantém seed demonstrativo de Campinas, SP enquanto a persistência é expandida.

## Direção visual

**Movimento:** neo-brutalismo suave com referências de flyers de show, capas de fita e interfaces de rádio pirata.

**Princípios:** a cidade aparece em primeiro lugar; capas e rostos têm protagonismo; ações principais são imediatas; densidade editorial sem parecer dashboard.

**Filosofia de cor:** ameixa quase preta para criar uma noite acolhedora; lima como assinatura de descoberta e “ao vivo”; coral para presença humana e urgência de show; lavanda para navegação e estados selecionados. Cor proprietária: `#c8f36a`.

**Layout:** trilho lateral no desktop, navegação inferior no mobile e seções horizontais que lembram uma banca de discos. O conteúdo alterna blocos largos e listas compactas, evitando uma grade centralizada genérica.

**Elementos assinatura:** wordmark `CENA.` com ponto lima fluorescente; chips de cidade com ícone de sinal; cartões de evento com data em bloco de cor; equalizador irregular como marca auxiliar.

**Interação e animação:** tocar música é instantâneo e não troca de tela; seguir, interessar-se e salvar têm resposta visual curta; filtros preservam o contexto regional; entradas usam fade/slide de 160–220ms; capas ganham escala 1,03 e brilho em hover; o player pulsa discretamente quando toca.

**Tipografia:** Geist/Inter para interface e títulos utilitários, com serif editorial opcional para chamadas de agenda. Títulos grandes, labels em caixa alta e metadados compactos.

**Essência e voz:** “o som da sua cidade, feito por quem vive nela”; personalidade próxima, elétrica e generosa. A voz é direta, local e convidativa, com chamadas como “A cidade tem som novo.” e “Chegue antes do refrão.”

## Arquitetura

- `client/src/App.tsx`: shell responsivo, rotas, providers e player persistente.
- `client/src/pages/Home.tsx`: navegação principal, descoberta, busca, eventos, biblioteca, perfil e upload em fluxo navegável.
- `client/src/index.css`: tokens visuais, layout desktop/mobile, cards, player e estados.
- `client/public/`: manifesto PWA, manifest de rotas e assets demonstrativos pequenos.
- `drizzle/schema.ts`: usuários, artistas, faixas, eventos, playlists, relações, follows, interesses e reproduções.
- `server/db.ts`: consultas e mutações persistentes com fallback seguro quando o banco não estiver disponível.
- `server/routers.ts`: procedimentos públicos e protegidos para descoberta, conta, follows, eventos, playlists, upload e atividade.
- `server/storage.ts`: fluxo de presigned upload para áudio e imagens, sempre protegido no servidor.

## Estratégia de entrega

1. Criar a base visual navegável e os dados seed de Campinas.
2. Implementar o player persistente e as ações locais de follow, interesse e playlist.
3. Substituir progressivamente dados locais por consultas tRPC e migrations Drizzle.
4. Integrar Manus OAuth mantendo o estado real de login e distinguindo `accountType` de `role`.
5. Integrar storage durável para áudio, capas e avatares, persistindo metadados no banco.
6. Validar `manus-routes.json`, TypeScript, build e a experiência em desktop/mobile.

## Decisões de MVP

- `tracks.album` continua texto; uma tabela de álbuns fica para uma evolução posterior.
- O ranking “Em alta” começa com seed/curadoria e pode usar `trackPlays` quando houver dados reais.
- `tracks.city` representa a cidade de gravação/publicação da faixa, não necessariamente a cidade do artista.
- Horários de eventos são armazenados em UTC e convertidos para a exibição local.
- Playlists colaborativas terão indicação visual clara; a autorização persistente será aplicada pelo servidor quando a playlist estiver conectada ao banco.
- Não haverá anúncios no MVP.
