# CENA Mobile

Aplicativo Android portátil em Expo Router/React Native para descobrir música independente, tocar faixas, acompanhar eventos e consultar tickets/merch do CENA. Este repositório é fonte do app, independente do CENA Web; não inclui cópia de banco, usuários, uploads ou credenciais.

## Configurar e executar

1. Instale Node.js 22 e pnpm 10.18.0 (`corepack prepare pnpm@10.18.0 --activate`).
2. Copie `.env.example` para `.env` e ajuste `EXPO_PUBLIC_CENA_API_BASE_URL` para a origem HTTPS do CENA Web. Essa URL é pública; não coloque tokens ou segredos em variáveis `EXPO_PUBLIC_*`.
3. Rode `pnpm install --frozen-lockfile`, depois `pnpm check` e `pnpm start`. Para testar no Android, abra o QR pelo Expo Go ou conecte um dispositivo Android com o servidor disponível.

O app usa consultas públicas HTTPS do CENA Web para descoberta, detalhes, agenda, tickets e merchandise. A tela Conta usa login Manus no navegador do sistema, recebe somente um ticket opaco de curta duração pelo deep link `cena://oauth/callback`, troca esse ticket por uma sessão Bearer e guarda a sessão no SecureStore. Artistas autenticados podem enviar áudio/capa pelo storage oficial e publicar com `scene.createTrack`; o retry usa a mesma chave de upload. O app não cria banco paralelo, não processa pagamento, reserva ou checkout. Faixas salvas continuam locais e privadas; localização é escolhida manualmente e não usa GPS.

As consultas públicas de tickets e merchandise usam `scene.eventTickets` e `scene.artistMerchandise` no backend CENA Web. O backend mantém lotes e itens informativos no banco, retorna somente eventos/artistas visíveis e estoque positivo, e não processa pagamentos, reservas ou checkout. O pacote mobile não aplica migrations nem grava dados.

## Limites atuais

- Tickets e merchandise apenas informam preço/disponibilidade e abrem destinos do artista; a CENA não processa pagamentos nem reservas.
- Conteúdo de demonstração é identificado como amostra e não é tratado como publicação real.
- O app precisa de conectividade para consultar o catálogo e transmitir áudio; mídia não é copiada nem mantida offline.
- Este pacote contém código Expo para importar em outro perfil; não contém APK/AAB assinado. A geração de artefato Android deve ser feita pelo Dashboard/EAS após a importação e configuração dos identificadores/credenciais desse perfil.
- O backend precisa aplicar `drizzle/0007_mobile_oauth_tickets.sql` e configurar `CENA_PUBLIC_BASE_URL` e `CENA_MOBILE_APP_CALLBACK_URIS` antes de validar login/publicação ponta a ponta.
