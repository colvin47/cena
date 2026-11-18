# CENA para Android

O app Expo/React Native usa a API principal CENA (`https://cena-kn4vk68m.manus.space`). Descoberta, busca, agenda, reprodução e favoritos locais foram preservados; o app não cria outro banco de faixas, usuários ou uploads.

## Login Manus

No Android, **Entrar com Manus** abre o navegador do sistema. O app valida um `state` próprio, recebe apenas um ticket opaco de curta duração pelo deep link e troca esse ticket por uma sessão Bearer na API CENA. O código OAuth fica no servidor; o JWT não entra no deep link e a sessão do Android é guardada no `SecureStore`. O app não tenta associar contas automaticamente por e-mail.

O app espera o scheme `cena` desta branch (`cena://oauth/callback`). O backend nativo foi integrado ao GitHub `main` no commit `ea2ca9f`; a migration aditiva é `drizzle/0015_mobile_oauth_tickets.sql`. Porém, o projeto Manus `wdp_694` ainda mostra o checkpoint anterior (`6e6bfbe`, 8 de novembro), sem o novo checkpoint/publicação. Portanto, login e upload ainda não estão operacionais de ponta a ponta.

A rota usa `CENA_PUBLIC_BASE_URL` (padrão: `https://cena-kn4vk68m.manus.space`) e permite schemes definidos em `CENA_MOBILE_APP_CALLBACK_URIS`; sem essa configuração, aceita `cena://oauth/callback`. Não substitua esse callback ao acrescentar outro scheme autorizado.

## Envio de música

O envio exige login Manus validado pela API, conta com perfil artístico, perfil de artista/banda, título, áudio e confirmação de direitos. Áudio: MP3, WAV, M4A ou OGG, até 50 MB. Capa é opcional: JPG, JPEG, PNG ou WebP, até 10 MB. O formulário reutiliza o endpoint `/api/upload`, o storage oficial e `scene.createTrack`; preserva metadados existentes (álbum, gênero, cidade, descrição, tipo/data de lançamento, visibilidade, créditos e coletivo quando a conta tem permissão `owner` ou `editor`). O servidor valida novamente sessão, tipo/tamanho, propriedade dos arquivos, perfil e permissões.

Após uma resposta de publicação ambígua, os arquivos são preservados e a mesma chave de idempotência é reutilizada se a pessoa tentar novamente sem alterar o formulário. Se o app for fechado durante o envio, confira primeiro no site/catálogo se a faixa foi publicada antes de iniciar outra tentativa. Nenhum arquivo real foi enviado durante a validação local.

## Executar e verificar

Requisitos e versões estão pinados em `mobile/package.json` e `mobile/pnpm-lock.yaml` (`pnpm@10.18.0`). Na pasta `mobile/`:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm check
corepack pnpm start
```

Defina `EXPO_PUBLIC_CENA_API_BASE_URL` com a origem HTTPS da API principal CENA. O perfil EAS `preview` usa `https://cena-kn4vk68m.manus.space` e produz um APK interno. Não coloque tokens ou segredos em variáveis `EXPO_PUBLIC_*`.

O APK anterior continua intacto. A branch `manus-cenacopy-preview` recebe as alterações do app; gere a próxima build de teste depois da publicação do backend para que login e upload possam ser validados contra as novas rotas. A conta Expo tem acesso de admin ao projeto `cena`, conectado ao repositório `colvin47/cena` com base `/mobile`.
