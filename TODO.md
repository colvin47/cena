# TODO — Cena

## 1. Shell responsivo e identidade da cena

- [ ] O produto deve ser uma experiência web responsiva, em visual moderno e escuro, inspirada em apps de música, mas com identidade mais calorosa de cena local.
- [ ] Em mobile, a navegação inferior deve conter Início, Buscar, Eventos, Biblioteca e Perfil.
- [ ] Em desktop, a navegação deve se adaptar para um trilho lateral e preservar o player persistente.
- [ ] Capas e fotos de artistas devem aparecer em destaque e os dados de exemplo devem ser fictícios de Campinas, SP.

## 2. Cadastro/login com papéis

- [ ] Deve existir entrada de cadastro/login com escolha entre ouvinte e artista/banda.
- [ ] O MVP deve usar login real do ambiente via Manus OAuth e manter estado logado/deslogado visível.
- [ ] O artista/banda deve ter acesso a ações de upload e criação de evento; o ouvinte deve ter descoberta, follows, playlists e interesse em eventos.

## 3. Descoberta regional e busca

- [ ] A tela inicial deve apresentar “Em alta na sua cidade”, com cidade visível e filtros por gênero/região.
- [ ] O usuário deve conseguir buscar por artista, faixa, gênero e cidade.
- [ ] O seed deve conter artistas, faixas e eventos fictícios de Campinas, SP para demonstração.

## 4. Player persistente

- [ ] Deve existir player persistente com play/pause, faixa atual, próxima faixa, barra de progresso e fila.
- [ ] Tocar faixas a partir da descoberta, do perfil e da busca deve atualizar o player sem trocar de tela.

## 5. Fluxo de upload do artista

- [ ] O artista deve conseguir iniciar upload de faixa/álbum informando título, capa, gênero, cidade e descrição.
- [ ] O upload deve exibir e exigir a declaração de que o próprio artista possui os direitos sobre o conteúdo, incluindo termos de uso.
- [ ] Áudio e imagens devem usar armazenamento durável; o banco deve guardar os metadados e os endereços estáveis.
- [ ] O MVP não deve exibir anúncios.

## 6. Perfil de artista/banda

- [ ] O perfil deve exibir bio, foto/identidade visual, faixas, redes sociais e próximos shows.
- [ ] Deve ser possível seguir o artista e compartilhar o link do perfil.

## 7. Agenda de shows e eventos

- [ ] O artista deve conseguir criar evento com nome, local, data, descrição e link de ingresso opcional.
- [ ] O ouvinte deve filtrar eventos por cidade/data e marcar “Tenho interesse”.
- [ ] Eventos e perfis/faixas devem oferecer compartilhamento por link.

## 8. Playlists e comunidade

- [ ] O ouvinte deve conseguir visualizar playlists seed, criar uma playlist local e indicar se ela é colaborativa.
- [ ] A interface deve comunicar que outros usuários podem adicionar faixas em playlists colaborativas.
- [ ] O usuário deve receber atualizações de novos lançamentos e shows dos artistas seguidos em uma área de biblioteca/atividade.

## 9. Base de dados e storage

- [ ] Modelar e migrar tabelas de usuários, artistas, faixas, eventos, playlists, relações de playlist, follows, interesse em eventos e reproduções no banco gerenciado.
- [ ] Adicionar integridade referencial, unicidade, índices de cidade/gênero/data/artista, `position` em playlists, `updatedAt` e auditoria mínima de direitos.
- [ ] Manter uma camada de seed demonstrativa no frontend enquanto a integração persistente é expandida.

## 10. Qualidade e entrega

- [ ] Servir `manus-routes.json` com todas as rotas de páginas do produto.
- [ ] Manter diagnósticos TypeScript registrados e corrigir erros acionáveis.
- [ ] Validar o build de frontend e backend e iniciar o servidor no runtime configurado.
- [ ] Fazer checkpoint apenas depois de validar as alterações no projeto.
